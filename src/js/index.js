// import * as bootstrap from 'bootstrap'
import { Chart } from 'chart.js/auto'

const navBar = document.getElementById('myTab')
const hazardInput = document.getElementById('hazard')

const bangladeshPop = 165000000
const bangladeshGDP2022 = 0.461 // Trillion dollars
const bangladeshDebt2020 = 0.14548 // Trillion dollars
const bangladeshDeficit2021 = 0.015008 // Trillion dollars
const hazards = ['cyclone', 'drought', 'flood', 'wildfire', 'heatwave']
const regions = [
  {
    name: 'Barishal',
    color: 'rgb(54, 162, 235)',
    startingValues: {
      gdp: (8331000/bangladeshPop) * bangladeshGDP2022, // proportional to population
      growth: -2.5,
      debt: ((8331000/bangladeshPop) * bangladeshDebt2020), // expressed in absolute terms here
      deficit: (8331000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Chattogram',
    color: 'rgb(255, 99, 132)',
    startingValues: {
      gdp: (28136000/bangladeshPop) * bangladeshGDP2022,
      growth: -2.75,
      debt: ((28136000/bangladeshPop) * bangladeshDebt2020),
      deficit: (28136000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Dhaka',
    color: 'rgb(75, 192, 192)',
    startingValues: {
      gdp: (39675000/bangladeshPop) * bangladeshGDP2022,
      growth: -3.5,
      debt: ((39675000/bangladeshPop) * bangladeshDebt2020),
      deficit: (39675000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Khulna',
    color: 'rgb(255, 159, 64)',
    startingValues: {
      gdp: (14873000/bangladeshPop) * bangladeshGDP2022,
      growth: -4.6,
      debt: ((14873000/bangladeshPop) * bangladeshDebt2020),
      deficit: (14873000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Mymensingh',
    color: 'rgb(153, 102, 255)',
    startingValues: {
      gdp: (11362000/bangladeshPop) * bangladeshGDP2022,
      growth: -1.75,
      debt: ((11362000/bangladeshPop) * bangladeshDebt2020),
      deficit: (11362000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Rajshahi',
    color: 'rgb(255, 205, 86)',
    startingValues: {
      gdp: (18506000/bangladeshPop) * bangladeshGDP2022,
      growth: -3.1,
      debt: ((18506000/bangladeshPop) * bangladeshDebt2020),
      deficit: (18506000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Rangpur',
    color: 'rgb(201, 203, 207)',
    startingValues: {
      gdp: (15805000/bangladeshPop) * bangladeshGDP2022,
      growth: -2.7,
      debt: ((15805000/bangladeshPop) * bangladeshDebt2020),
      deficit: (15805000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Sylhet',
    color: 'rgb(30, 30, 30)',
    startingValues: {
      gdp: (9798000/bangladeshPop) * bangladeshGDP2022,
      growth: -6,
      debt: ((9798000/bangladeshPop) * bangladeshDebt2020),
      deficit: (9798000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
]

// Generic info about graphs. The 'shape' numbers are factors by which to multiply things in order to create a certain shape of graph in
// way that is agnostic of the initial value (which is represented by '1'). These curves should be relatively gentle, so that
// they can be multiplied by the intensity etc and still yield realistic numbers.
const graphs = [
  {
    title: 'Projected GDP growth (%)',
    id: 'growth',
    unit: '%',
    shape: [1, 1.3, 1.1, 0.9, 0.79, 0.78, 0.6, 0.5, 0.47, 0.43, 0.1] // Assume initial value is negative.
  },
  {
    title: 'GDP ($ trillion)',
    id: 'gdp',
    unit: 'T$',
    shape: [1, 0.9, 0.92, 0.93, 0.935, 0.94, 0.95, 0.958, 0.963, 0.97, 0.973]
  },
  { // Since this is expressed as a percent of GDP, to be internally consistent, I am writing
    // out the absolute debt figure, which we will later calculate as a percent of GDP.
    title: 'Debt (% GDP)',
    id: 'debt',
    unit: '%',
    shape: [1, 1.2, 1.29, 1.33, 1.35, 1.34, 1.3, 1.28, 1.25, 1.24, 1.19]
  },
  {
    title: 'Budget deficit ($ trillion)',
    id: 'deficit',
    unit: 'T$',
    shape: [1, 1.5, 1.49, 1.47, 1.4, 1.41, 1.36, 1.30, 1.28, 1.2, 1.17, 1.15, 1.1]
  },
]

// Until we have the real model, use stupid data:
// Each region's population will be a multiplier that determines its starting GDP, and the
// 3 other starting values will vary by region somewhat randomly
// Then the time-series will impose a shape on the values (slightly differently per region and per hazard.
// 'Intensity' input will exaggerate this time-series shape by some multiplier (but should never exceed -100%).
// Similar for assumptions: these will just be exaggerations on the time-series shape.
// Intensity: higher input number means lower gdp growth, lower gdp, higher debt, higher budget deficit
// Household: idk what this is
// Firm investment: idk what this is
// Monetary policy: higher number means inverse of intensity
// Fiscal policy: higher number means inverse of intensity

// dataSource: {
//   oxfordshire: {
//     gdp: {
//       cyclone: [0, 1, 2, etc],
//     }
//   }
// }
let dataSource = {}
// Cycle through graphs before regions, since debt values depend on earlier GDP values
graphs.forEach((graph) => {
  regions.forEach((region) => {
    
    if (dataSource[region.name] === undefined) {
      dataSource[region.name] = {}
    }
    if (dataSource[region.name][graph.id] === undefined) {
      dataSource[region.name][graph.id] = {}
    }

    hazards.forEach((hazard) => {
      if (dataSource[region.name][graph.id][hazard] === undefined) {
        dataSource[region.name][graph.id][hazard] = {}
      }
      // Read a starting value and add in some randomization so that regions/hazards have slightly different starts from each other
      const startingValue = perturb(region.startingValues[graph.id])
      // Scale each step in the 'graph shape' time series by the starting value
      // Add in some randomization so that regions/hazards have slightly different shapes from each other
      timeSeries = graph.shape.map((item) => perturb(item * startingValue))
      
      // If the graph in q is debt, we now need to convert the absolute debt into a percent of GDP
      if (graph.id.includes('debt')) {
        gdpTimeSeries = dataSource[region.name]['gdp'][hazard]
        timeSeries = timeSeries.map((absoluteDebt, i) => {
          const gdpAtThisTimeStep = gdpTimeSeries[i]
          const debtAsProportionOfGDP = (absoluteDebt/gdpAtThisTimeStep) * 100
          console.log(absoluteDebt, debtAsProportionOfGDP)
          return debtAsProportionOfGDP
        })
      }
      
      dataSource[region.name][graph.id][hazard] = timeSeries
    })
  })
})

function perturb(num) {
  return getRandomFloat(0.7, 1.4, 2) * num
}
function getRandomFloat(min, max, decimals) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);

  return parseFloat(str);
}

const tabs = graphs.map(graph => document.getElementById(`${graph['id']}-tab`))
tabs.forEach((tab) => {
  tab.addEventListener('click', function() {
    // Update UI of tabs
    tabs.forEach((tab) => tab.classList.remove('active'))
    tab.classList.add('active')
    const graph = graphs.filter((graph) => `${graph['id']}-tab` === tab.id)[0]
    // Update chart axes' labels and (undisplayed) chart title
    chart.options.plugins.title.text = graph['title']
    chart.options.scales.y.title.text = graph['title']
    chart.options.scales.y.ticks.callback = function(value, _index, _ticks) {
      return value + graph['unit']
    },
    refreshChart()
  })
})

const years = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032']
Chart.defaults.elements.line.tension = 0.1;

var config = {
  type: 'line',
  data: {
    labels: years,
    datasets: [{
      label: graphs[0]['title'],
      data: [],
      borderWidth: 1,
    }]
  },
  options: {
    plugins: {
      legend: {
        labels: {
          filter: item => {
            if (item.text !== undefined) {
              return !item.text.includes("95% CI")
            }
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Include a unit in the ticks
          callback: function(value, index, ticks) {
            return value + graphs[0]['unit']
          },
        },
        title: {
          display: false,
          text: graphs[0],
        },
      },
    },
  }
};

const ctx = document.getElementById('myChart');
const chart = new Chart(ctx, config);




const intensityReadout = document.getElementById('intensityReadout')
const intensityInput = document.getElementById('intensity')
const householdReadout = document.getElementById('householdReadout')
const householdInput = document.getElementById('household')
const firmReadout = document.getElementById('firmReadout')
const firmInput = document.getElementById('firm')
const bankReadout = document.getElementById('bankReadout')
const bankInput = document.getElementById('bank')
const govReadout = document.getElementById('govReadout')
const govInput = document.getElementById('gov')


// Household selling assets is bad, firm investment is good, contractionary is bad, and expansionary is good.
// Set an amount by which to damage the economy (with a 'noise factor') for each year, e.g. '0.2' means 'scale by 120%'
const householdOrFirmBasic = [-35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35]
const householdPerturbations = householdOrFirmBasic.map((n) => perturb(0 - (n/100)))
const firmPerturbations = householdOrFirmBasic.map((n) => perturb(n/100))
const bankOrGovBasic = [-3, -2, -1, 0, 1, 2, 3]
const bankPerturbations = bankOrGovBasic.map((n) => perturb(n/100))
const govPerturbations = bankOrGovBasic.map((n) => perturb(n/100))

const intensities = {
  "1": "5",
  "2": "10",
  "3": "20",
  "4": "50",
  "5": "100"
}
const policies = {
  "-3": "Very contractionary",
  "-2": "Contractionary",
  "-1": "Slightly contractionary",
  "0": "Average", // TODO: or 'no change'?
  "1": "Slightly expansionary",
  "2": "Expansionary",
  "3": "Very expansionary"
}
window.onload = () => {
  intensityReadout.innerText = `${intensities[intensityInput.value]}-year event`
  updateHouseholdReadout(householdInput.value)
  updateFirmReadout(firmInput.value)
  updateBankReadout(bankInput.value)
  updateGovReadout(govInput.value)
  refreshChart()
};
intensityInput.addEventListener('change', function() {
  intensityReadout.innerText = `${intensities[this.value]}-year event`
  refreshChart()
});

bankInput.addEventListener('change', function() {
  updateBankReadout(this.value)
  refreshChart()
});
function updateBankReadout(value) {
  bankReadout.innerText = policies[value]
}
govInput.addEventListener('change', function() {
  updateGovReadout(this.value)
  refreshChart()
});
function updateGovReadout(value) {
  govReadout.innerText = policies[value]
}


const regionInputs = regions.map((region) => {
  return document.getElementById(region.name)
})
regionInputs.forEach((el) => {
  el.addEventListener('click', function() {
    refreshChart()
  })
})


householdInput.addEventListener('change', function() {
  updateHouseholdReadout(this.value)
  refreshChart()
});
function updateHouseholdReadout(value) {
  value = parseInt(value)
  if (value === 0) {
    householdReadout.innerText = 'No increase'
  } else {
    const fallOrIncrease = value > 0 ? 'increase' : 'fall'
    householdReadout.innerText = `${Math.abs(value)}% ${fallOrIncrease}`
  }
}

firmInput.addEventListener('change', function() {
  updateFirmReadout(this.value)
  refreshChart()
});
function updateFirmReadout(value) {
  value = parseInt(value)
  if (value === 0) {
    firmReadout.innerText = 'No increase'
  } else {
    const fallOrIncrease = value > 0 ? 'increase' : 'fall'
    firmReadout.innerText = `${Math.abs(value)}% ${fallOrIncrease}`
  }
}

hazardInput.addEventListener('change', function() {
  refreshChart()
});

function refreshChart() {
  applyDatasetsToChart(getDataToDisplay())
}

function getDataToDisplay() {
  // Initialize empty data object
  let dataToDisplay = {}
  // check which output to display
  const activeTabId = getActiveTabId()
  const currentGraphIsCorrelatedWithGoodEconomy = activeTabId.includes('growth') || activeTabId.includes('gdp')
  // check which hazard
  const activeHazard = getActiveHazard()
  // check which regions to display
  const activeRegions = getActiveRegions()
  // add them all to the graph
  activeRegions.forEach((activeRegion) => {
    if (dataToDisplay[activeRegion] === undefined) {
      dataToDisplay[activeRegion] = {}
    }
    if (dataToDisplay[activeRegion][activeTabId] === undefined) {
      dataToDisplay[activeRegion][activeTabId] = {}
    }
    let timeSeries = dataSource[activeRegion][activeTabId][activeHazard]
    if (numbersMayBeNegative()) {

      // Get a feel for the orders of magnitude we're working with
      const meanData = absMean(timeSeries)

      timeSeries = timeSeries.map((item, index) => {

      
        // For graphs that can pass the zero mark, don't multiply these, but rather add them as constant
        // influence per year, so that values near 0 in later years are able to drift away from 0 (in either direction)
        const annualIntensityInfluence = (intensityInput.value * meanData) / 10
        const annualHouseholdInfluence = householdPerturbations[householdOrFirmBasic.indexOf(parseInt(householdInput.value))] * meanData
        const annualFirmInfluence = firmPerturbations[householdOrFirmBasic.indexOf(parseInt(firmInput.value))] * meanData
        const annualBankInfluence = bankPerturbations[bankOrGovBasic.indexOf(parseInt(bankInput.value))] * meanData
        const annualGovInfluence = govPerturbations[bankOrGovBasic.indexOf(parseInt(govInput.value))] * meanData
        const totalInfluence = annualIntensityInfluence + annualHouseholdInfluence + annualFirmInfluence + annualBankInfluence + annualGovInfluence

        if (currentGraphIsCorrelatedWithGoodEconomy) {
          item += ((index + 1) * totalInfluence)
        } else {
          item -= ((index + 1) * totalInfluence)
        }
        const valueCannotGoBelowNegative100 = activeTabId === 'growth'
        return valueCannotGoBelowNegative100 && item < -100 ? -90 : item
      })
    } else {
      // For graphs that can't pass the zero mark by definition, apply scaling factors (multiply).
      timeSeries = timeSeries.map((item, index) => { 
        const annualIntensityScalar = [1.07, 1.13, 1.2, 1.3, 1.5][parseInt(intensityInput.value) - 1]
        const annualHouseholdScalar = 1 + householdPerturbations[householdOrFirmBasic.indexOf(parseInt(householdInput.value))]
        const annualFirmScalar = 1 + firmPerturbations[householdOrFirmBasic.indexOf(parseInt(firmInput.value))]
        const annualBankScalar = 1 + bankPerturbations[bankOrGovBasic.indexOf(parseInt(bankInput.value))]
        const annualGovScalar = 1 + govPerturbations[bankOrGovBasic.indexOf(parseInt(bankInput.value))]
        let scalar = annualIntensityScalar * annualHouseholdScalar * annualFirmScalar * annualGovScalar * annualBankScalar
        scalar = scalar / (index + 1) // with `index`, apply less influence each year.
        if (currentGraphIsCorrelatedWithGoodEconomy) {
          item = item * scalar
        } else {
          item = item / scalar
        }
        return item
      })
    }
      
    dataToDisplay[activeRegion][activeTabId][activeHazard] = timeSeries
  })
  return dataToDisplay
}

function numbersMayBeNegative() {
  const activeTabId = getActiveTabId()
  return activeTabId.includes('growth') || activeTabId.includes('deficit')
}

// Applies datasets (pre-calculated) to the chart, and adds CIs to them
function applyDatasetsToChart(dataDict) {
  const activeTabId = getActiveTabId()
  const activeHazard = getActiveHazard()
  let regionsToDisplay = Object.keys(dataDict)
  let datasets = regionsToDisplay.map((region, i) => {
    newData = dataDict[region][activeTabId][activeHazard]
    if (newData === undefined) {
      return {}
    } else {
      const color = regions.filter((r) => r.name === region)[0].color
      const transparentColor = color.slice(0,-1) + ', 0.3)'
      return [
        {label: region, data: newData, borderWidth: 1, backgroundColor: color, borderColor: color},
        {label: `${region}: 95% CI upper bound`, data: generateBound(newData, 'upper'), borderWidth: 1, backgroundColor: transparentColor, pointRadius: 0, fill: (3*i)+2}, // "Fill the color up until dataset N": 2, 5, 8, 11, etc
        {label: `${region}: 95% CI lower bound`, data: generateBound(newData, 'lower'), borderWidth: 1, pointRadius: 0}
      ]
    } 
  })
  chart.data.datasets = datasets.flat()
  chart.update()
}

function getActiveTabId() {
  return [...navBar.getElementsByTagName('button')]
    .filter((button) => button.className.includes('active'))[0].id.replace('-tab', '')
}

function getActiveHazard() {
  return hazardInput.value
}

const noRegionsTip = document.getElementById('warning')
function getActiveRegions() {
  const activeRegions = regionInputs.filter((input) => input.checked).map((input) => input.id)
  if (activeRegions.length === 0) {
    noRegionsTip.className = "visible text-danger"
  } else {
    noRegionsTip.className = "invisible"
  }
  return activeRegions
}

function generateBound(data, lowerOrUpperBound) {
  const meanData = absMean(data)
  if (lowerOrUpperBound === 'lower') {
    return data.map((d, i) => {
      output = i === 0 ? d : d - meanData * (1.0/((data.length-i)))
      return (numbersMayBeNegative() || output > 0) ? output : 0
    })
  } else if (lowerOrUpperBound === 'upper') {
    return data.map((d, i) => {
      return i === 0 ? d : d + meanData * (1.0/((data.length-i)))
    })
  }
}

// Average the absolute values, since otherwise, if the negs and pos's cancel out, the result can be 0 or near 0.
function absMean(data) {
  return Math.abs(data.reduce((acc, cur) => Math.abs(acc) + Math.abs(cur))/data.length)
}