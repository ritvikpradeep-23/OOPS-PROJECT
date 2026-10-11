import React from 'react';

const ErrorNote = ({ message }) => message
    ? <p role="alert" style={{ color: 'var(--color-danger-text)', fontSize: '0.85rem', margin: '0 0 1rem' }}>{message}</p>
    : null;

export default ErrorNote;
