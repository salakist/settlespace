import React from 'react';
import { Alert } from '@mui/material';

interface SearchResultsAlertProps {
  entityName: string;
}

const SearchResultsAlert: React.FC<SearchResultsAlertProps> = ({ entityName }) => (
  <Alert severity="info">No {entityName} found.</Alert>
);

export default SearchResultsAlert;
