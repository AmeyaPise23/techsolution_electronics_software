# Admin Product Management System

A complete, production-ready admin panel for managing e-commerce products with full CRUD functionality.

## ✨ Features

### 📦 Product Management
- **Full CRUD Operations**: Create, Read, Update, Delete products
- **Comprehensive Product Form** with all required fields:
  - Basic Info: Name, SKU, Category, Brand, Descriptions
  - Pricing: Price, Discount Price, Tax Percentage
  - Inventory: Stock Quantity, Stock Status (In Stock, Out of Stock, Pre Order)
  - Images: Multiple image support with preview
  - Features: Dynamic feature list
  - Specifications: Key-value pairs (e.g., Processor: Intel i7)
  - SEO: Meta Title & Description

### 🎨 User Interface
- **Modern SaaS Design**: Clean, minimal aesthetic inspired by Stripe and Apple
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Sidebar Navigation**: Dashboard, Products, Orders, Settings
- **Mobile-Friendly**: Hamburger menu for mobile devices
- **Premium Styling**: Soft shadows, rounded corners, excellent spacing

### 🔍 Advanced Features
- **Search Functionality**: Search products by name or SKU
- **Category Filtering**: Filter by product category
- **Product Stats**: Real-time dashboard statistics
- **Image Previews**: Visual preview of product images
- **Form Validation**: Required field validation
- **Toast Notifications**: Success/error feedback
- **Loading States**: Visual feedback during operations
- **Delete Confirmation**: Safety dialog before deleting products

## 🚀 Getting Started

### Accessing the Admin Panel

1. **From Public Site**: Click the dashboard icon in the top navbar
2. **Direct URL**: Navigate to `/admin`

### Admin Routes

- `/admin` - Dashboard with stats and quick actions
- `/admin/products` - Product management page
- `/admin/orders` - Orders page (placeholder)
- `/admin/settings` - Settings page (placeholder)

### Using the Product Management System

#### View Products
1. Navigate to `/admin/products`
2. View all products in a table format
3. See product image, name, SKU, category, price, stock, and status

#### Add New Product
1. Click "Add Product" button
2. Fill in the required fields (marked with *)
3. Add images by pasting URLs
4. Add features and specifications dynamically
5. Click "Create Product"

#### Edit Product
1. Click the edit icon (pencil) on any product row
2. Modify the fields in the form
3. Click "Update Product"

#### Delete Product
1. Click the delete icon (trash) on any product row
2. Confirm the deletion in the dialog

#### Search & Filter
1. Use the search bar to find products by name or SKU
2. Use the category dropdown to filter by category

## 🔌 Backend Integration

The admin panel is **ready for backend integration**. All API calls are centralized in `/src/app/services/productService.ts`.

### Quick Integration Steps

1. **Update API URL**:
   ```typescript
   const API_BASE_URL = "https://your-backend-api.com/api";
   ```

2. **Uncomment API Calls**: In `productService.ts`, uncomment the fetch calls and remove mock implementations

3. **Required Endpoints**:
   - `GET /products` - Get all products
   - `GET /products/:id` - Get single product
   - `POST /products` - Create product
   - `PUT /products/:id` - Update product
   - `DELETE /products/:id` - Delete product

See `BACKEND_INTEGRATION.md` for detailed integration guide.

## 📊 Current State

### What's Working (Frontend Only)
✅ Product form with all fields
✅ Form validation
✅ Image preview (URL-based)
✅ Dynamic features and specifications
✅ Search and filter
✅ Toast notifications
✅ Loading states
✅ Responsive design
✅ Sample data from existing products

### What Needs Backend
⏳ Data persistence across sessions
⏳ Image upload to cloud storage
⏳ Multi-user support
⏳ Real-time inventory sync

## 🎨 Design System

Built with **Radix UI components**:
- Dialog (for product form modal)
- Table (for product list)
- Select (for dropdowns)
- Input, Textarea (for form fields)
- Button, Badge (for actions and status)
- Alert Dialog (for delete confirmation)
- Toast (for notifications)

## 📱 Responsive Breakpoints

- **Mobile**: < 640px - Single column, hamburger menu
- **Tablet**: 640px - 1024px - Sidebar visible, 2-column forms
- **Desktop**: > 1024px - Full layout with sidebar

## 🎯 Future Enhancements

### Immediate
- [ ] File upload for images (drag & drop)
- [ ] Bulk product import/export
- [ ] Product categories management
- [ ] Image optimization

### Advanced
- [ ] Product variants (size, color)
- [ ] Inventory tracking & alerts
- [ ] Order management system
- [ ] Analytics dashboard
- [ ] User roles & permissions
- [ ] Audit logs

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v7
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Form Handling**: React Hook Form ready

## 📝 Notes

### Sample Data
The admin panel currently loads existing sample products for demonstration. These products are read-only until you connect a backend.

### Navigation
- **Admin → Store**: "Back to Store" link in sidebar
- **Store → Admin**: Dashboard icon in navbar

### Validation
Required fields:
- Product Name
- SKU
- Category
- Short Description
- Price
- Stock Quantity
- Stock Status

### Stock Status Options
- **In Stock**: Product available for purchase
- **Out of Stock**: Product not available
- **Pre Order**: Product available for pre-order

## 🤝 Support

For backend integration help, refer to `BACKEND_INTEGRATION.md`.

## 📄 License

This is a frontend-only implementation ready for your backend integration.
