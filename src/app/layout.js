import './globals.css';
import '../components/Sidebar.css';
import '../components/DrivenFactor.css';
import '../components/DetailedExpense.css';
import '../components/PnL.css';
import '../components/Capex.css';
import '../components/Inventory.css';
import '../components/Manpower.css';
import '../components/Dashboard.css';
import '../components/LoginPage.css';
import '../components/CostCenter.css';

export const metadata = {
  title: 'ASA Philippines Budgeting System',
  description: 'Enterprise budgeting and forecasting system for ASA Philippines Foundation Inc.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Web_app/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
