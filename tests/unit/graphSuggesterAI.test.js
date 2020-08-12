/**
 * @file graphSuggesterAI.test.js
 * Project: Data Visualisation Generator
 * Copyright: Open Source
 * Organisation: Doofenshmirtz Evil Incorporated
 * Modules: None
 * Related Documents: SRS Document - www.example.com
 * Update History:
 * Date          Author             Changes
 * -------------------------------------------------------------------------------
 * 06/08/2020   Marco Lombaard     Original
 * 06/08/2020   Marco Lombaard     Fixed erroneous test input 'option'
 *
 * Test Cases: none
 *
 * Functional Description: This file implements a unit test to see if the graph suggester controller component is working properly.
 * This file calls a few functions in the controller component to test their functionality
 *
 * Error Messages: "Error"
 * Assumptions: None
 * Constraints: None
 */

const graphSuggesterAI = require('../../controllers/graphSuggester/graphSuggesterAI/graphSuggesterAI').getInstance();
const jsonData = {

	'data': [

		{

			'__metadata': {

				'uri': 'https://services.odata.org/V2/Northwind/Northwind.svc/Products(1)', 'type': 'NorthwindModel.Product'

			},
			'ProductID': 1,
			'ProductName': 'Chai',
			'SupplierID': 1,
			'CategoryID': 1,
			'QuantityPerUnit': '10 boxes x 20 bags',
			'UnitPrice': '18.0000',
			'UnitsInStock': 39,
			'UnitsOnOrder': 0,
			'ReorderLevel': 10,
			'Discontinued': false,
			'Category': {

				'__deferred': {

					'uri': 'https://services.odata.org/V2/Northwind/Northwind.svc/Products(1)/Category'

				}

			}, 'Order_Details': {

				'__deferred': {

					'uri': 'https://services.odata.org/V2/Northwind/Northwind.svc/Products(1)/Order_Details'

				}

			}, 'Supplier': {

				'__deferred': {

					'uri': 'https://services.odata.org/V2/Northwind/Northwind.svc/Products(1)/Supplier'

				}

			}

		}
	]
};
const metadata = {
	'Product': [
		'ProductID',
		'ProductName',
		'SupplierID',
		'CategoryID',
		'QuantityPerUnit',
		'UnitPrice',
		'UnitsInStock',
		'UnitsOnOrder',
		'ReorderLevel',
		'Discontinued',
	],
};

const option = [ 'QuantityPerUnit',
	'UnitPrice', 'UnitsInStock', 'UnitsOnOrder', 'ReorderLevel', 'Discontinued' ];

const items = {
	'Product': [ 'ProductID', 'ProductName', 'SupplierID', 'CategoryID', 'QuantityPerUnit',
		'UnitPrice', 'UnitsInStock', 'UnitsOnOrder', 'ReorderLevel', 'Discontinued' ]
};

const associations = {
	'Product': [ 'Category', 'Order_Details', 'Supplier' ],
};

const types = {
	'Product': [ 'int', 'string', 'int', 'int', 'int',
		'int', 'int', 'int', 'int', 'bool' ],
};

describe('Testing functions within the graphSuggesterAI class', function () {
	test('Returns true to a field that is not excluded', () => {
		expect(graphSuggesterAI.notInExclusions('yes')).toBe(true);
	});

	test('Excludes field and returns false when checked if it is not excluded', () => {
		graphSuggesterAI.excludeFields([ 'red' ]);
		expect(graphSuggesterAI.notInExclusions('red')).toBe(false);
	});

	test('Generates a null suggestion on null input', () => {
		expect(graphSuggesterAI.getSuggestions(null)).toBeNull();
	});

	test('Generates a null suggestion when no metadata exists yet', () => {
		expect(graphSuggesterAI.getSuggestions(jsonData)).toBeNull();
	});

	test('Successfully sets metadata', () => {
		graphSuggesterAI.setMetadata(items, associations, types);
		expect(graphSuggesterAI.terminals).toMatchObject(metadata);
	});

	test('Generates a suggestion when receiving valid data and metadata exists', () => {
		graphSuggesterAI.setMetadata(items, associations, types);
		expect(graphSuggesterAI.getSuggestions(jsonData)).not.toBeNull();
	});

	test('Genetic algorithm returns null on null data', () => {
		graphSuggesterAI.setMetadata(items, associations, types);
		expect(graphSuggesterAI.geneticAlgorithm(null, null)).toBeNull();
	});

	test('Genetic algorithm returns suggestion', () => {
		graphSuggesterAI.setMetadata(items, associations, types);
		console.log(graphSuggesterAI.geneticAlgorithm(option, 'Product'));
		expect(graphSuggesterAI.geneticAlgorithm(option, 'Product')).toHaveLength(3);
	});
});