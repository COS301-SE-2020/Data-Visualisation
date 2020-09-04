/**
 * @file dataSourceController.js
 * Project: Data Visualisation Generator
 * Copyright: Open Source
 * Organisation: Doofenshmirtz Evil Incorporated
 * Modules: None
 * Related Documents: SRS Document - www.example.com
 * Update History:
 * Date          Author              Changes
 * -------------------------------------------------------------------------------
 * 2/07/2020    Phillip Schulze     Original
 *
 * Test Cases: none
 *
 * Functional Description: This file implements a GraphQL class that gets GraphQL and formats this data
 *
 * Error Messages: "Error"
 * Assumptions: None
 * Constraints: None
 */
const axios = require('axios');
// const PRODUCTION = !!(process.env.NODE_ENV && process.env.NODE_ENV === 'production');
/**
 * Purpose: This class is responsible for getting GraphQL.
 * Usage Instructions: Use the corresponding getters to retrieve class variables. And use the format to format this GraphQL
 * @author Phillip Schulze
 */
class GraphQL {
	/**
	 * This function gets GraphQL.
	 * @param src the source where this GraphQL must be retrieved from
	 * @returns a promise of GraphQL
	 */
	static getMetaData(src) {
		if (GraphQL.logging) console.log('GraphQL: ', src);
		return new Promise((resolve, reject) => {
			axios
				.post(src, GraphQL.query(GraphQL.metadataStr()))
				.then((res) => {
					const { __schema: schema } = res.data.data;
					resolve(schema);
				})
				.catch((err) => reject(err));
		});
	}

	/**
	 * This function gets entity data.
	 * @param src the source where the entity data must be retrieved from
	 * @param entity the entity that we want data from
	 * @returns a promise of the entities data
	 */
	static getEntityData(src, entity, fieldlist) {
		if (GraphQL.logging) console.log('GraphQL: ', src);
		return new Promise((resolve, reject) => {
			axios
				.post(src, GraphQL.query(GraphQL.entityDataStr(entity, fieldlist)))
				.then((res) => {
					resolve(res.data.data[entity]);
				})
				.catch((err) => reject(err));
		});
	}

	/**
	 * This function parses the metadata which is received in JSON format and passes it to the suggester
	 * so it knows what it can suggest. It passes the properties(treated as terminal nodes) and the
	 * navigation properties(so it can go to deeper layers) via the setMetadata function.
	 * @param meta the metadata in JSON format.
	 * @returns an object containing the parsed items and associated tables as well as the item sets and data-types in each "table"
	 */
	static parseMetadata(meta) {
		if (!meta || meta == null) return null; //eslint-disable-line

		if (meta && meta.types && Array.isArray(meta.types)) {
			for (let t = 0; t < meta.types.length; t++) {
				if (meta.types[t] && meta.types[t].fields && Array.isArray(meta.types[t].fields)) {
					for (let i = 0; i < meta.types[t].fields.length; ++i) {
						if (meta.types[t].fields[i] && meta.types[t].fields[i].type) {
							while (typeof meta.types[t].fields[i].type.name !== 'undefined' && meta.types[t].fields[i].type.name == null) {
								meta.types[t].fields[i].type = meta.types[t].fields[i].type.ofType;
							}
							delete meta.types[t].fields[i].type.ofType;
						}
					}
				}
			}
		}

		let entityMap = {};
		meta.types.forEach((type) => (entityMap[type.name] = type));

		const pruneNames = ['Query', '__Schema', '__Type', '__Field', '__InputValue', '__EnumValue', '__Directive'];
		let sets = meta.types.filter((type) => type.kind === 'OBJECT' && !pruneNames.includes(type.name)).map((type) => type.name);

		let items = {};
		let associations = {}; //associated tables - used in suggestion generation
		let types = {}; //the data types of the fields
		let prims = {};

		sets.forEach((entity) => {
			// console.log(entityMap[entity].fields.map((field) => field.name + ' : ' + field.kind));

			let IDfound = false;
			items[entity] = entityMap[entity].fields.map((field) => {
				if (!IDfound && field.type.name === 'ID') {
					IDfound = true;
					prims[entity] = field.name;
				}
				return field.name;
			});

			types[entity] = entityMap[entity].fields.map((field) => field.type.name);
		});

		sets.forEach((entity) => {
			associations[entity] = entityMap[entity].fields.filter((field) => field.type.kind === 'OBJECT').map((field) => field.name);
		});

		return { items, associations, sets, types, prims };
	}

	static query(strQuery) {
		return { query: strQuery };
	}

	static entityDataStr(entity, fieldlist) {
		return GraphQL.queryEntityData(entity, fieldlist);
	}

	static metadataStr() {
		return GraphQL.fragmentFullType() + GraphQL.fragmentInputValue() + GraphQL.fragmentTypeRef() + GraphQL.queryIntrospection();
	}

	static fragmentFullType() {
		return `
		fragment FullType on __Type {
			kind name
			fields{ name args { ...InputValue } type { ...TypeRef } }
			enumValues { name }
			possibleTypes { ...TypeRef }
		}
		`;
	}

	static fragmentInputValue() {
		return 'fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue }';
	}

	static fragmentTypeRef(lvls = 8) {
		const fields = 'kind name';
		const min = 1;
		if (lvls < min) lvls = min;
		let str = fields;
		for (let i = min; i < lvls; ++i) str = fields + ' ofType { ' + str + ' }';
		return 'fragment TypeRef on __Type { ' + str + '}';
	}

	static queryIntrospection() {
		return `  
		  query IntrospectionQuery {
			__schema {
			  types {
				...FullType
			  }
			}
		  }
		`;
	}

	static queryEntityData(entity, fieldlist) {
		return `query EntityDataQuery { ${entity} { ${fieldlist.join(' ')} } }`;
	}
}
GraphQL.logging = false;

module.exports = GraphQL;