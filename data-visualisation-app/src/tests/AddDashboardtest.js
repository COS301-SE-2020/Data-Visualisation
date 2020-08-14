import React from 'react';
import { render, fireEveent, queryByPlaceholderText, fireEvent } from '@testing-library/react';
import AddDashboard from '../pages/AddDashboard';

it('renders correctly', () =>{
    const{queryByTestId, queryAllByPlaceholderText} = render(<AddDashboard/>)
    expect(queryByTestId('add-button')).toBeTruthy();
    expect(queryAllByPlaceholderText('Consumer')).toBeTruthy();
})

describe('Input value', () => {
    it('updates on change', () =>{
        const {queryByPlaceholderText} = render(<AddDashboard/>)

        const addInput = queryByPlaceholderText('Consumer');

        fireEvent.change(addInput, {target: {value: 'test'}})

        expect(addInput.value).toBe('test');
    })
})


