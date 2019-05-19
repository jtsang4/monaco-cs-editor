import React from 'react';
import logo from './logo.svg';
import Editor from './Editor';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <div
        >
          <Editor/>
        </div>
      </header>
    </div>
  );
}

export default App;
