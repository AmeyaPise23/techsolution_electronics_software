Design a modern, enterprise-grade Finance & Business Analytics Module that integrates into the existing Admin Dashboard of an industrial hardware and e-commerce platform.

The application already contains:

* Authentication
* Sidebar Navigation
* Products Management
* Orders Management
* Customers Management
* E-commerce Website

Add a new sidebar section called **Finance**.

The purpose of this module is not only invoice generation but complete financial visibility into the business, allowing management to analyze revenue, expenses, profitability, outsourcing costs, operational costs, cash flow, and business performance.

---

## SIDEBAR STRUCTURE

Finance
├── Overview
├── Revenue Analytics
├── Expenses
├── Profit Analysis
├── Outsourcing
├── Invoices
├── Cash Flow
├── Reports

---

## FINANCE OVERVIEW DASHBOARD

Create an executive-level dashboard displaying:

Top KPI Cards:

* Total Revenue
* Gross Profit
* Net Profit
* Total Expenses
* Outstanding Payments
* Cash Available
* Monthly Revenue
* Monthly Profit
* Profit Margin %
* Active Customers
* Total Invoices
* Average Order Value

Each KPI card should include:

* Current value
* Percentage change
* Trend indicator
* Comparison with previous period

---

## REVENUE ANALYTICS

Interactive charts and reports:

1. Monthly Revenue Trend
2. Quarterly Revenue Trend
3. Revenue by Product
4. Revenue by Category
5. Revenue by Customer
6. Revenue by Region

Charts:

* Line Charts
* Bar Charts
* Donut Charts
* Area Charts

Filters:

* Date Range
* Product Category
* Customer
* Region

---

## EXPENSE MANAGEMENT

Track all company expenses.

Expense Categories:

* Outsourcing
* Salaries
* Marketing
* Software Licenses
* Cloud Hosting
* Office Expenses
* Utilities
* Logistics
* Travel
* Miscellaneous

Features:

* Add Expense
* Edit Expense
* Delete Expense
* Categorize Expenses
* Upload Supporting Documents

Visualizations:

* Expense Breakdown Chart
* Monthly Expense Trends
* Expense Distribution by Category

---

## PROFIT ANALYSIS

Provide detailed profitability analysis.

Automatically calculate:

Revenue

* Product Cost

---

Gross Profit

Gross Profit

* Outsourcing Cost
* Salaries
* Marketing
* Infrastructure
* Operational Expenses
* Taxes

---

Net Profit

Display:

* Gross Profit
* Net Profit
* Profit Margin %
* Operating Margin %
* Monthly Profit Trends

Charts:

* Profit Trend
* Profit vs Revenue
* Margin Analysis

---

## PRODUCT PROFITABILITY

Display product-wise profitability.

Table Columns:

* Product Name
* Revenue
* Cost
* Gross Profit
* Net Profit
* Margin %

Features:

* Sort by profitability
* Filter by category
* Export report

---

## CUSTOMER PROFITABILITY

Display customer-wise profitability.

Table Columns:

* Customer Name
* Revenue Generated
* Cost Incurred
* Net Profit
* Total Orders
* Profit Margin %

Highlight:

* Most Valuable Customers
* Highest Profit Customers
* Lowest Profit Customers

---

## OUTSOURCING MANAGEMENT

Track all outsourcing and vendor expenses.

Metrics:

* Total Outsourcing Cost
* Cost by Vendor
* Cost by Project
* Monthly Outsourcing Spend

Vendor Table:

* Vendor Name
* Service
* Project
* Cost
* Invoice Reference
* Payment Status

Charts:

* Vendor Cost Distribution
* Monthly Outsourcing Trend

---

## INVOICE MANAGEMENT

Invoice Features:

* Create Invoice
* Edit Invoice
* View Invoice
* Print Invoice
* Download PDF
* Search Invoices
* Filter Invoices

Invoice Status:

* Draft
* Pending
* Paid
* Overdue
* Cancelled

Invoice Table:

* Invoice Number
* Customer
* Date
* Due Date
* Amount
* GST Amount
* Status

---

## CREATE INVOICE FORM

Customer Information:

* Customer Name
* Company Name
* Email
* Phone
* Billing Address
* GST Number

Invoice Information:

* Invoice Number
* Invoice Date
* Due Date

Products Section:

* Product Selector
* Quantity
* Unit Price
* Discount
* GST %
* Total

Allow:

* Multiple Products
* Add Row
* Remove Row

Automatically Calculate:

* Subtotal
* Discounts
* GST
* Taxes
* Grand Total

Display live invoice preview.

---

## CASH FLOW ANALYSIS

Track money movement.

Metrics:

* Cash Inflow
* Cash Outflow
* Pending Receivables
* Upcoming Payables
* Available Cash

Charts:

* Monthly Cash Flow
* Cash Flow Forecast

---

## REPORTING

Generate reports for:

* Revenue Reports
* Expense Reports
* Profit Reports
* Vendor Reports
* Customer Reports
* Invoice Reports

Export Formats:

* PDF
* Excel
* CSV

---

## API INTEGRATION READY

Do not implement backend logic.

Create service layer placeholders for future API integration.

Example endpoints:

GET /finance/overview
GET /finance/revenue
GET /finance/expenses
GET /finance/profit
GET /finance/vendors
GET /finance/cashflow

GET /invoices
GET /invoices/:id
POST /invoices
PUT /invoices/:id

Use realistic mock data for development.

---

## UI / UX REQUIREMENTS

* Premium SaaS Dashboard Design
* Modern ERP Style Interface
* ShadCN UI Components
* Tailwind CSS
* TypeScript
* Responsive Layout
* Dark Mode Support
* Professional Data Tables
* Interactive Charts
* Skeleton Loading States
* Empty States
* Toast Notifications
* Clean Typography
* Consistent Spacing
* Accessible Design

---

## GOAL

Create a complete Finance, Profitability, Expense Tracking, Outsourcing Management, Cash Flow, and Invoice Management system that provides management with deep business insights and financial visibility while remaining modern, clean, and easy to use.
