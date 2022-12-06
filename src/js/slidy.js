// import * as bootstrap from 'bootstrap'
import { Chart } from 'chart.js/auto'

const navBar = document.getElementById('myTab')

const bangladeshPop = 165000000
const bangladeshGDP2022 = 0.461 // Trillion dollars
const bangladeshDebt2020 = 0.14548 // Trillion dollars
const bangladeshDeficit2021 = 0.015008 // Trillion dollars
const regions = [
  {
    name: 'Barishal',
    startingValues: {
      gdp: (8331000/bangladeshPop) * bangladeshGDP2022, // proportional to population
      growth: -2.5,
      debt: (((8331000/bangladeshPop) * bangladeshDebt2020) / ((8331000/bangladeshPop) * bangladeshGDP2022)) * 100, // percent of gdp
      deficit: (8331000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Chattogram',
    startingValues: {
      gdp: (28136000/bangladeshPop) * bangladeshGDP2022,
      growth: -2.75,
      debt: (((28136000/bangladeshPop) * bangladeshDebt2020) / ((28136000/bangladeshPop) * bangladeshGDP2022)) * 100,
      deficit: (28136000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Dhaka',
    startingValues: {
      gdp: (39675000/bangladeshPop) * bangladeshGDP2022,
      growth: -3.5,
      debt: (((39675000/bangladeshPop) * bangladeshDebt2020) / ((39675000/bangladeshPop) * bangladeshGDP2022)) * 100,
      deficit: (39675000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Khulna',
    startingValues: {
      gdp: (14873000/bangladeshPop) * bangladeshGDP2022,
      growth: -4.6,
      debt: (((14873000/bangladeshPop) * bangladeshDebt2020) / ((14873000/bangladeshPop) * bangladeshGDP2022)) * 100,
      deficit: (14873000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Mymensingh',
    startingValues: {
      gdp: (11362000/bangladeshPop) * bangladeshGDP2022,
      growth: -1.75,
      debt: (((11362000/bangladeshPop) * bangladeshDebt2020) / ((11362000/bangladeshPop) * bangladeshGDP2022)) * 100,
      deficit: (11362000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Rajshahi',
    startingValues: {
      gdp: (18506000/bangladeshPop) * bangladeshGDP2022,
      growth: -3.1,
      debt: (((18506000/bangladeshPop) * bangladeshDebt2020) / ((18506000/bangladeshPop) * bangladeshGDP2022)) * 100,
      deficit: (18506000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Rangpur',
    startingValues: {
      gdp: (15805000/bangladeshPop) * bangladeshGDP2022,
      growth: -2.7,
      debt: (((15805000/bangladeshPop) * bangladeshDebt2020) / ((15805000/bangladeshPop) * bangladeshGDP2022)) * 100,
      deficit: (15805000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
  {
    name: 'Sylhet',
    startingValues: {
      gdp: (9798000/bangladeshPop) * bangladeshGDP2022,
      growth: -6,
      debt: (((9798000/bangladeshPop) * bangladeshDebt2020) / ((9798000/bangladeshPop) * bangladeshGDP2022)) * 100,
      deficit: (9798000/bangladeshPop) * bangladeshDeficit2021,
    }
  },
]

// displayedDataDict: A dictionary tracking which data should currently be displayed. The time series are associated with regions, so we
// need to remember which region it was so we can remove that region's data from the dict. The same is true
// for the four outputs: we need to remember which is active.
// Same structure as dataSource (though only one output can be present at once):
// dataSource: {
//   oxfordshire: {
//     gdp: [0, 1, 2, etc]
//   }
// }
let displayedDataDict = {}

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
    // out the absolute debt figure, which we will later calculate as a percent of GDP. TODO
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
//     gdp: [0, 1, 2, etc]
//   }
// }
let dataSource = {}
graphs.forEach((graph) => {
  regions.forEach((region) => {
    startingValue = region.startingValues[graph.id]
    if (dataSource[region.name] === undefined) {
      dataSource[region.name] = {}
    }
    // Multiply each step in the shape time series by the starting value
    timeSeries = graph.shape.map((item) => item * startingValue)
    dataSource[region.name][graph.id] = timeSeries
    // TODO: add in some randomization so that regions have slightly different shapes from each other
    // TODO: If the graph in q is debt, we now need to convert the absolute debt into a percent of GDP
  })
})

const tabs = graphs.map(graph => document.getElementById(`${graph['id']}-tab`))
tabs.forEach((tab) => {
  tab.addEventListener('click', function() {
    tabs.forEach((tab) => tab.classList.remove('active'))
    tab.classList.add('active')
    const graph = graphs.filter((graph) => `${graph['id']}-tab` === tab.id)[0]
    chart.options.plugins.title.text = graph['title']
    chart.options.scales.y.title.text = graph['title']
    chart.options.scales.y.ticks.callback = function(value, index, ticks) {
      return value + graph['unit']
    },
    changeAllData([{
      label: graph['title'],
      data: [0, 19, 3, 5, 2, 3, 7, 2, 8, 3, 7, 12],
      borderWidth: 1,
    }])
  })
})

function addData(chart, datasets) {
  chart.data.datasets = datasets;
  // chart.data.datasets.forEach((dataset))
  chart.update()
}

function removeAllData(chart) {
  chart.data.datasets = []
  chart.update()
}

function changeAllData(datasets) {
  removeAllData(chart)
  addData(chart, datasets)
}

function exampleChange() {
  let data = [1, 2, 3, 2, 1, 3]
  changeAllData([{label: 'likes', data: data, borderWidth: 1}])
}

// function removeData(chart) {
//   chart.data.labels.pop();
//   chart.data.datasets.forEach((dataset) => {
//       dataset.data.pop();
//   });
//   chart.update()
// }

// We'll need four charts eventually:
// {
//   label: 'GDP ($ trillion)',
//   data: [],
//   borderWidth: 1
// },{
//   label: 'Debt (% GDP)',
//   data: [],
//   borderWidth: 1
// },{
//   label: 'Budget deficit ($ trillion)',
//   data: [],
//   borderWidth: 1
// }

Chart.defaults.elements.line.tension = 0.1;

var config = {
  type: 'line',
  data: {
    labels: ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032'],
    datasets: [{
      label: graphs[0]['title'],
      data: [12, 19, 3, 5, 2, 3, 7, 2, 8, 3, 7, 12],
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
const intensities = {
  "1": "5",
  "2": "10",
  "3": "20",
  "4": "50",
  "5": "100"
}
window.onload = () => {
  intensityReadout.innerText = `${intensities[intensityInput.value]}-year event`
};
intensityInput.addEventListener('click', function() {
  intensityReadout.innerText = `${intensities[this.value]}-year event`
});

const regionInputs = regions.map((region) => {
  return document.getElementById(region.name)
})
regionInputs.forEach((el) => {
  const activeTabId = getActiveTabId()
  el.addEventListener('click', function() {
    if (displayedDataDict[this.id] === undefined) {displayedDataDict[this.id] = {}}
    // If the input is now checked, add the data to the graph
    if (this.checked) {
      let timeSeries = dataSource[this.id][activeTabId]
      // Scale the data by the intensity factor
      // Actually, that should happen inside a shared function, since it needs to be
      // called when we click on ANY input.
      const intensity = getCurrentIntensity()
      timeSeries = timeSeries.map((item) => item * intensity)

      displayedDataDict[this.id][activeTabId] = timeSeries
      
      
      // TODO: we need to make sure it's scaled by intensity etc
    } else if (displayedDataDict[this.id][activeTabId]){ // Else remove it if it exists.
      delete displayedDataDict[this.id][activeTabId];
    }
    updateData(displayedDataDict)
  })
})

function getCurrentIntensity() {
  return intensityInput.value
}

function updateData(dataDict) {
  const activeTabId = getActiveTabId()
  let regionsToDisplay = Object.keys(dataDict)
  let datasets = regionsToDisplay.map((region) => {
    newData = dataDict[region][activeTabId]
    if (newData === undefined) {
      return {}
    } else {
      const color = 'rgb(54, 162, 235)' // TODO: vary colors
      const transparentColor = color.slice(0,-1) + ', 0.3)'
      return [
        {label: region, data: newData, borderWidth: 1, backgroundColor: color, borderColor: color},
        {label: `${region}: 95% CI upper bound`, data: generateBound(newData, 'upper'), borderWidth: 1, backgroundColor: transparentColor, pointRadius: 0, fill: 2}, // "Fill to dataset 2"
        {label: `${region}: 95% CI lower bound`, data: generateBound(newData, 'lower'), borderWidth: 1, pointRadius: 0}
      ]
    } 
  })
  changeAllData(datasets.flat())
}

function getActiveTabId() {
  return [...navBar.getElementsByTagName('button')]
    .filter((button) => button.className.includes('active'))[0].id.replace('-tab', '')
}

function generateBound(data, lowerOrUpperBound) {
  console.log(data)
  // TODO: do something much better than average because this can be v low or zero if negative numbers
  const meanData = Math.abs(data.reduce((acc, cur) => Math.abs(acc) + Math.abs(cur))/data.length)
  if (lowerOrUpperBound === 'lower') {
    return data.map((d, i) => {
      return i === 0 ? d : d - meanData * (1.0/((data.length-i)))
    })
  } else if (lowerOrUpperBound === 'upper') {
    return data.map((d, i) => {
      return i === 0 ? d : d + meanData * (1.0/((data.length-i)))
    })
  }
}

document.getElementById('household').onchange = function() {
  const newData = [parseInt(this.value), 2, 3, 4, 5, 6, 7, 8, 3, 0]
  const color = 'rgb(54, 162, 235)'
  const transparentColor = color.slice(0,-1) + ', 0.3)'
  changeAllData(
    [
      {label: 'likes', data: newData, borderWidth: 1, backgroundColor: 'rgb(54, 162, 235)', borderColor: 'rgb(54, 162, 235)'},
      {label: '95% CI upper bound', data: generateBound(newData, 'upper'), borderWidth: 0, backgroundColor: transparentColor, pointRadius: 0, fill: 2}, // "Fill to dataset 2"
      {label: '95% CI lower bound', data: generateBound(newData, 'lower'), borderWidth: 0, pointRadius: 0},
    ]
  )
};