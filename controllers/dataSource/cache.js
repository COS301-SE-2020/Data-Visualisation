/**
 * @file  cache.test.js
 * Project: Data Visualisation Generator
 * Copyright: Open Source
 * Organisation: Doofenshmirtz Evil Incorporated
 * Modules: None
 * Related Documents: SRS Document - www.example.com
 * Update History:
 * Date          Author             Changes
 * -------------------------------------------------------------------------------
 * 06/08/2020   Phillip Schulze     Original
 * 14/09/2020	Marco Lombaard		Added primaryKey field to getEntityData
 *
 * Test Cases: none
 *
 * Functional Description: This file implements a cache using the singleton pattern. This cache stores data the was previously
 * requested from external data sources, and thus can be accessed in the future without making additional requests to external sources.
 *
 * Error Messages: "Error"
 * Assumptions: None
 * Constraints: None
 */

const CacheMaker = (function () {
	let instance = null;
	/**
	 * This class handles chache data requested from external data sources.
	 * Usage Instructions: metadata, entityList and fieldList of all data sources that where accessed recently are saved here.
	 * @author Phillip Schulze
	 */
	class Cache {
		constructor() {
			this.metaData = {}; //Meta => { 'src': {timestamp, data:{items, associations, sets, types }}}
			this.entityData = {}; //Data => { 'src': {'entity': {timestamp, data:{items, associations, sets, types }}}}
			this.defaultMaxTime = 1000 * 60 * 60 * 0.5; //ms => 30mins
			this.maxTime = this.defaultMaxTime;
			this.maxTimeLive = 1000 * 20; //ms => 20secs
		}
		isLiveData(src) {
			if (this.metaData && this.metaData[src]) return this.metaData[src].isLiveData;
			return false;
		}

		getMetaData(src) {
			if (this.metaData && this.metaData[src]) return this.metaData[src].data;
			return null;
		}
		getEntityList(src) {
			if (this.metaData && this.metaData[src]) return this.metaData[src].data.items;
			return null;
		}

		getEntityData(src, entity, field, primaryKey = null) {
			// console.log(src, entity, Object.keys(this.entityData[src]), this.metaData[src]);

			if (this.entityData && this.entityData[src] && this.entityData[src][entity] && this.entityData[src][entity].data && Object.keys(this.entityData[src][entity].data).length > 0) {
				const data = this.entityData[src][entity].data;

				let prim;
				// eslint-disable-next-line eqeqeq
				if (primaryKey == null) {
					prim = this.metaData[src].data.prims[entity];
					if (!this.metaData[src].data.items[entity].includes(prim)) {
						prim = this.metaData[src].data.items[entity][0];
					}
				} else {
					prim = primaryKey;
				}

				if (!data || !prim || !field) {
					return null;
				}

				return data.map((item, i) => [item[prim], item[field]]);
			}
			return null;
		}

		getEntityDataAll(src, entity) {
			if (this.entityData && this.entityData[src] && this.entityData[src][entity] && this.entityData[src][entity].data && Object.keys(this.entityData[src][entity].data).length > 0) {
				return this.entityData[src][entity].data;
			}
			return null;
		}

		validateMetadata(src, isLiveData) {
			if (this.metaData && this.metaData[src] && Object.keys(this.metaData[src]).length > 0) {
				this.metaData[src].isLiveData = isLiveData;

				if (Date.now() - this.metaData[src].timestamp >= this.maxTime) {
					this.onMetadataTimedout(src, this.metaData[src]);
					this.removeMetaData(src);
					return false;
				}
				return true;
			} else return false;
		}

		validateMetadataAll(src, entity, set, field) {
			// validate(this.validateMetadata(src, this.isLiveData(src)));
			// validate(this.metaData[src].data.items[entity]);
			// validate(this.metaData[src].data.types[entity]);
			// validate(this.metaData[src].data.prims[entity]);
			// validate(this.metaData[src].data.prims[set]);
			// validate(this.metaData[src].data.prims[entity] || this.metaData[src].data.prims[set]);
			// validate(this.metaData[src].data.items[entity].indexOf(field) >= 0);
			// validate(this.metaData[src].data.sets.indexOf(set) >= 0);

			return (
				this.validateMetadata(src, this.isLiveData(src)) &&
				this.metaData[src].data.items[entity] &&
				this.metaData[src].data.types[entity] &&
				(this.metaData[src].data.prims[entity] || this.metaData[src].data.prims[set]) &&
				this.metaData[src].data.items[entity].indexOf(field) >= 0 &&
				this.metaData[src].data.sets.indexOf(set) >= 0
			);
		}

		validateEntityData(src, entity) {
			if (!this.validateMetadata(src, this.isLiveData(src))) return false;

			if (this.entityData && this.entityData[src] && this.entityData[src][entity] && Object.keys(this.entityData[src][entity]).length > 0) {
				const maxTime = this.metaData[src].isLiveData ? this.maxTimeLive : this.maxTime;

				if (Date.now() - this.entityData[src][entity].timestamp >= maxTime) {
					this.onEntityDataTimedout(src, entity, this.entityData[src][entity]);
					this.removeEntityData(src, entity);
					return false;
				}

				return true;
			} else {
				return false;
			}
		}

		setMetaData(src, data, isLiveData) {
			if (!this.metaData) this.metaData = {};

			// console.log('META', src, data);

			this.metaData[src] = {
				isLiveData,
				timestamp: Date.now(),
				data,
			};
		}

		setEntityData(src, entity, data) {
			if (!this.entityData) this.entityData = {};
			if (!this.entityData[src]) this.entityData[src] = {};

			if (!Array.isArray(data)) {
				if (typeof data === 'object') {
					if (Object.keys(data) === 0) return;
					if (Object.keys(data) === 1) data = [data];
					else {
						data = Object.keys(data).map((key) => data[key]);
					}
				} else return;
			}
			this.entityData[src][entity] = {
				timestamp: Date.now(),
				data,
			};
		}

		removeField(src, entity, set, field) {
			if (this.validateMetadataAll(src, entity, set, field)) {
				let index = this.metaData[src].data.items[entity].indexOf(field);

				// console.log('BEFORE', this.metaData[src].data);

				this.metaData[src].data.items[entity].splice(index, 1);
				this.metaData[src].data.types[entity].splice(index, 1);

				if (this.metaData[src].data.items[entity].length <= 0) {
					this.removeEntity(src, entity, set);
				}
				// console.log('AFTER', this.metaData[src].data);
			} else {
				console.log('Cannot remove field: ', src, entity || set, field);
			}
		}

		removeEntity(src, entity, set) {
			if (this.validateMetadata(src, this.isLiveData(src))) {
				let primEntity = this.metaData[src].data.prims[entity] ? entity : set;

				delete this.metaData[src].data.items[entity];
				delete this.metaData[src].data.types[entity];
				delete this.metaData[src].data.associations[entity];
				if (this.metaData[src].data.prims[primEntity]) delete this.metaData[src].data.prims[primEntity];

				const setIndex = this.metaData[src].data.sets.indexOf(set);
				if (setIndex >= 0) this.metaData[src].data.sets.splice(setIndex, 1);

				if (this.validateEntityData(src, entity)) {
					this.removeEntityData(src, entity);
				}
			} else {
				console.log('Cannot remove entity: ', src, entity);
			}
		}

		removeMetaData(src) {
			this.metaData[src] = {};
		}
		removeEntityData(src, entity) {
			if (this.entityData && this.entityData[src]) {
				this.entityData[src][entity] = {};
				if (Object.keys(this.entityData[src]).length <= 0) {
					this.entityData[src] = {};
				}
			}
		}

		onMetadataTimedout(src, cdata) {
			console.log('Removed Meta data:', src);
		}
		onEntityDataTimedout(src, entity, cdata) {
			console.log('Removed Entity data:', src, entity);
		}
	}

	return {
		/**
		 * A function that returns a singleton object of the Cache type.
		 * @return {Cache} an object that stores data from previous requests.
		 */
		getInstance: function () {
			if (instance === null) {
				instance = new Cache();
				instance.constructor = null;
			}
			return instance;
		},
	};
})();

function validate(bool) {
	if (bool) console.log('TRUE');
	else console.log('FALSE');
}

module.exports = CacheMaker.getInstance();
