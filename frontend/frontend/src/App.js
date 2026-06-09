// import logo from './logo.svg';
import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <>
      <Router>

        <AuthProvider>

          <Routes>
            <Route path="/" element={<LandingPage></LandingPage>}> </Route>
            <Route path="/auth" element={<Authentication />}></Route>
          </Routes>

        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
