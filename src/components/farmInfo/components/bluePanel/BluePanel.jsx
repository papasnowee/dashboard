import React from 'react';
import { Text, Wrapper, Col, Title } from './BluePanelStyles';

const BluePanel = ({ value, text }) => {
    return (
        <Wrapper>
            <Col>
                <Title>{value}</Title>
                <Text>{text}</Text>
            </Col>
        </Wrapper>
    );
};

export default BluePanel;
