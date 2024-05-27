document.getElementById('csvFileInput').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const csvData = event.target.result;
        parseCSV(csvData);
    };
    reader.readAsText(file);
}

function parseCSV(csvData) {
    const parsedData = d3.csvParse(csvData);
    displayData(parsedData);
}

function displayData(data) {
    const output = d3.select('#output');
    output.html(''); // Clear any previous output

    // Create a table to display the CSV data
    const table = output.append('table');
    const thead = table.append('thead');
    const tbody = table.append('tbody');

    // Extract and display the header
    const headers = Object.keys(data[0]);
    thead.append('tr')
        .selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .text(d => d);

    // Extract and display the rows
    const rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    rows.selectAll('td')
        .data(row => headers.map(header => row[header]))
        .enter()
        .append('td')
        .text(d => d);
}