const fs = require('fs');
let utils = fs.readFileSync('js/utils.js', 'utf8');
let dash = fs.readFileSync('js/dashboard.js', 'utf8');
dash = dash.replace(/document\.getElementById\([^)]*\)\.value/g, '0');
dash = dash.replace(/document\.querySelectorAll.*?\n/g, '');
dash = dash.replace(/document\.getElementById.*?\n/g, '');
const code = utils + '\n' + dash + `
const facturas = [{
    monthYear: '2026-05',
    items: [ { concepto: 'Energia', unidad: 'KWH', cantidad: 100, costo: 100, order: 1 } ]
}];
const res = aggregateData(facturas, '2026-05', 'USD', 7.8);
console.log(res.conceptos);
`;
fs.writeFileSync('test_dash.js', code);
