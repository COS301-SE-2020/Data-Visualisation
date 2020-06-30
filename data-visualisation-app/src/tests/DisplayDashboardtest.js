import React from 'react';
import { render } from '@testing-library/react';
import DisplayDashboard from "../pages/DisplayDashboard";
import DisplayGraph from "../pages/DisplayDashboard/DisplayGraph";
import renderer from 'react-test-renderer';
import graph1 from "../assets/img/Graphs/Barchart.png";
import graph2 from "../assets/img/Graphs/PieChart.jpg";

describe( 'Renders the dashboard display', () => {
    it('displays graph', () => {
        const comp = renderer.create(
            <DisplayGraph data={"test"}/>
        );

        const tree = comp.toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('displays dashboard', () => {
        const dashboard = {
            name: 'Banking',
            description:
                'This is a banking business intelligence dashboard that analytically displays different banking data sets across multiple systems. ',
            id: 0,
            graphs: [{source: graph1, graphtypeid: 1}, {source: graph2, graphtypeid: 2}, {source: graph1, graphtypeid: 1}],
        }
        const comp = renderer.create(
            <DisplayDashboard backFunc={() => {}} editDashboard={() => {}} dashboard={dashboard} reqGraphList={() => {}}/>
        );

        const tree = comp.toJSON();
        expect(tree).toMatchSnapshot();
    });

})