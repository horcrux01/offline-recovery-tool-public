import { Box } from '@mui/material';
import React from 'react';
import { Provider } from 'react-redux';
import store from 'store';
import OfflineRecoveryComponent from 'OfflineRecovery/OfflineRecoveryComponent';

const App: React.FC = () => (
  <Provider store={store}>
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <OfflineRecoveryComponent />
    </Box>
  </Provider>
);

export default App;
