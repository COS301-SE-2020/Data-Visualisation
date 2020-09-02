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
 * 02/08/2020    Elna Pistorius      Original
 *
 * Test Cases: none
 *
 * Functional Description: This file implements a exports controller.
 *
 * Error Messages: "Error"
 * Assumptions: None
 * Constraints: None
 */

class Exports{
    /**
     * This function generates exportable json of a chart
     * @param config the config of the whole chart
     */
    static json(config){
        console.log(config);
        return 0;
    }
    /**
     * This function generates exportable csv of a chart
     * @param config the types of graphs that needs to be updated
     */
    static csv(config){
        console.log(config);
        return 0;
    }
}
module.exports = Exports;