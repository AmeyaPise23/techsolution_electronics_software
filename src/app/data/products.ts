export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  image: string;
  images: string[];
  inStock: boolean;
  features: string[];
  specifications: { label: string; value: string }[];
  userReviews: {
    id: string;
    name: string;
    rating: number;
    date: string;
    comment: string;
  }[];
}

export const products: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    description: "High-fidelity sound with active noise cancellation and 30-hour battery life",
    price: 349.99,
    rating: 4.8,
    reviews: 1247,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&q=80",
    ],
    inStock: true,
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Premium sound quality",
      "Comfortable over-ear design",
      "Bluetooth 5.0 connectivity",
      "Built-in microphone for calls",
    ],
    specifications: [
      { label: "Driver Size", value: "40mm" },
      { label: "Frequency Response", value: "20Hz - 20kHz" },
      { label: "Impedance", value: "32 Ohm" },
      { label: "Weight", value: "250g" },
      { label: "Battery Life", value: "30 hours" },
      { label: "Charging Time", value: "2 hours" },
    ],
    userReviews: [
      {
        id: "r1",
        name: "Sarah Johnson",
        rating: 5,
        date: "May 15, 2026",
        comment: "Amazing sound quality and the noise cancellation is superb. Best headphones I've ever owned!",
      },
      {
        id: "r2",
        name: "Mike Chen",
        rating: 4,
        date: "May 10, 2026",
        comment: "Great headphones overall. Battery life is impressive. Only minor gripe is they're a bit heavy for long sessions.",
      },
    ],
  },
  {
    id: "2",
    name: "Minimalist Leather Watch",
    description: "Elegant timepiece with Italian leather strap and sapphire crystal",
    price: 299.99,
    rating: 4.9,
    reviews: 892,
    category: "Watches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80",
    ],
    inStock: true,
    features: [
      "Sapphire crystal glass",
      "Italian leather strap",
      "Water resistant up to 50m",
      "Swiss quartz movement",
      "Minimalist design",
      "2-year warranty",
    ],
    specifications: [
      { label: "Case Diameter", value: "40mm" },
      { label: "Case Material", value: "Stainless Steel" },
      { label: "Strap Material", value: "Italian Leather" },
      { label: "Water Resistance", value: "50m" },
      { label: "Movement", value: "Swiss Quartz" },
      { label: "Warranty", value: "2 years" },
    ],
    userReviews: [
      {
        id: "r3",
        name: "Emma Davis",
        rating: 5,
        date: "May 20, 2026",
        comment: "Absolutely gorgeous watch. The leather is so soft and the design is timeless.",
      },
      {
        id: "r4",
        name: "James Wilson",
        rating: 5,
        date: "May 18, 2026",
        comment: "Perfect everyday watch. Looks great with both casual and formal wear.",
      },
    ],
  },
  {
    id: "3",
    name: "Smart Fitness Tracker",
    description: "Track your health and fitness goals with advanced sensors and AI insights",
    price: 179.99,
    rating: 4.6,
    reviews: 2341,
    category: "Wearables",
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80",
      "https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=800&q=80",
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&q=80",
    ],
    inStock: true,
    features: [
      "Heart rate monitoring",
      "Sleep tracking",
      "7-day battery life",
      "Water resistant IP68",
      "Multiple sport modes",
      "Smartphone notifications",
    ],
    specifications: [
      { label: "Display", value: "1.4\" AMOLED" },
      { label: "Battery Life", value: "7 days" },
      { label: "Water Resistance", value: "IP68" },
      { label: "Sensors", value: "Heart Rate, SpO2, Accelerometer" },
      { label: "Connectivity", value: "Bluetooth 5.1" },
      { label: "Compatibility", value: "iOS & Android" },
    ],
    userReviews: [
      {
        id: "r5",
        name: "Alex Rodriguez",
        rating: 5,
        date: "May 22, 2026",
        comment: "Love this tracker! The battery lasts forever and the insights are really helpful.",
      },
    ],
  },
  {
    id: "4",
    name: "Ultra-Slim Laptop Stand",
    description: "Ergonomic aluminum laptop stand with adjustable height and cooling design",
    price: 79.99,
    rating: 4.7,
    reviews: 567,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80",
    ],
    inStock: true,
    features: [
      "Premium aluminum construction",
      "Adjustable height (6 levels)",
      "Improved airflow for cooling",
      "Non-slip rubber pads",
      "Supports laptops up to 17\"",
      "Portable and foldable",
    ],
    specifications: [
      { label: "Material", value: "Aluminum Alloy" },
      { label: "Weight", value: "320g" },
      { label: "Dimensions", value: "260 x 220 x 15mm" },
      { label: "Max Load", value: "8kg" },
      { label: "Adjustable Heights", value: "6 levels (100-150mm)" },
      { label: "Compatibility", value: "11-17 inch laptops" },
    ],
    userReviews: [
      {
        id: "r6",
        name: "Lisa Thompson",
        rating: 5,
        date: "May 19, 2026",
        comment: "Game changer for my home office setup. My neck pain is gone!",
      },
    ],
  },
  {
    id: "5",
    name: "Wireless Charging Pad",
    description: "Fast wireless charging for all Qi-enabled devices with sleek design",
    price: 49.99,
    rating: 4.5,
    reviews: 1893,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1591290619762-d118f5050e6e?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1591290619762-d118f5050e6e?w=800&q=80",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&q=80",
    ],
    inStock: true,
    features: [
      "15W fast charging",
      "Universal Qi compatibility",
      "LED charging indicator",
      "Over-temperature protection",
      "Anti-slip surface",
      "Ultra-thin design",
    ],
    specifications: [
      { label: "Output Power", value: "15W / 10W / 7.5W / 5W" },
      { label: "Input", value: "USB-C" },
      { label: "Dimensions", value: "100mm diameter" },
      { label: "Weight", value: "85g" },
      { label: "Material", value: "Aluminum & Tempered Glass" },
      { label: "Compatibility", value: "All Qi-enabled devices" },
    ],
    userReviews: [
      {
        id: "r7",
        name: "David Lee",
        rating: 4,
        date: "May 16, 2026",
        comment: "Works great and looks premium. Charges my phone quickly.",
      },
    ],
  },
  {
    id: "6",
    name: "Professional Camera Backpack",
    description: "Durable camera backpack with customizable compartments and weather protection",
    price: 189.99,
    rating: 4.8,
    reviews: 423,
    category: "Photography",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
    ],
    inStock: true,
    features: [
      "Customizable padded dividers",
      "Water-resistant fabric",
      "Tripod attachment straps",
      "Laptop compartment (15\")",
      "Side access for quick retrieval",
      "Comfortable padded straps",
    ],
    specifications: [
      { label: "Capacity", value: "20L" },
      { label: "Dimensions", value: "45 x 30 x 18cm" },
      { label: "Weight", value: "1.2kg" },
      { label: "Material", value: "Water-resistant Nylon" },
      { label: "Laptop Size", value: "Up to 15 inches" },
      { label: "Camera Capacity", value: "1-2 DSLRs + 4-6 lenses" },
    ],
    userReviews: [
      {
        id: "r8",
        name: "Jennifer Martinez",
        rating: 5,
        date: "May 14, 2026",
        comment: "Perfect for my photography trips. Everything fits perfectly and stays protected.",
      },
    ],
  },
  {
    id: "7",
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with custom switches and aluminum frame",
    price: 159.99,
    rating: 4.9,
    reviews: 3421,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
      "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80",
    ],
    inStock: true,
    features: [
      "Hot-swappable switches",
      "RGB backlighting",
      "Aluminum frame",
      "USB-C connection",
      "N-key rollover",
      "Programmable keys",
    ],
    specifications: [
      { label: "Switch Type", value: "Mechanical (Hot-swappable)" },
      { label: "Layout", value: "TKL (87 keys)" },
      { label: "Backlighting", value: "RGB per-key" },
      { label: "Connection", value: "USB-C (detachable)" },
      { label: "Frame Material", value: "Aluminum" },
      { label: "Keycaps", value: "Double-shot PBT" },
    ],
    userReviews: [
      {
        id: "r9",
        name: "Chris Anderson",
        rating: 5,
        date: "May 21, 2026",
        comment: "Best keyboard I've ever used. The build quality is exceptional.",
      },
    ],
  },
  {
    id: "8",
    name: "Portable Bluetooth Speaker",
    description: "360° sound with deep bass and 24-hour playtime, perfect for any adventure",
    price: 129.99,
    rating: 4.7,
    reviews: 2156,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
    ],
    inStock: false,
    features: [
      "360° surround sound",
      "24-hour battery life",
      "IPX7 waterproof",
      "Built-in power bank",
      "TWS pairing support",
      "Compact and portable",
    ],
    specifications: [
      { label: "Output Power", value: "20W" },
      { label: "Battery Life", value: "24 hours" },
      { label: "Water Resistance", value: "IPX7" },
      { label: "Bluetooth Version", value: "5.0" },
      { label: "Weight", value: "580g" },
      { label: "Dimensions", value: "180 x 65 x 65mm" },
    ],
    userReviews: [
      {
        id: "r10",
        name: "Rachel Green",
        rating: 5,
        date: "May 17, 2026",
        comment: "Incredible sound for the size. Battery lasts forever!",
      },
    ],
  },
  {
    id: "9",
    name: "Smart LED Desk Lamp",
    description: "Eye-caring LED lamp with wireless charging base and touch controls",
    price: 89.99,
    rating: 4.6,
    reviews: 756,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
      "https://images.unsplash.com/photo-1541417904950-b855846fe074?w=800&q=80",
    ],
    inStock: true,
    features: [
      "Adjustable color temperature",
      "Wireless charging base",
      "Touch controls",
      "Memory function",
      "Eye-caring LED",
      "USB charging port",
    ],
    specifications: [
      { label: "Color Temperature", value: "3000K - 6000K" },
      { label: "Brightness Levels", value: "Stepless dimming" },
      { label: "Power", value: "12W LED" },
      { label: "Wireless Charging", value: "10W" },
      { label: "USB Port", value: "5V/1A" },
      { label: "Material", value: "Aluminum alloy" },
    ],
    userReviews: [
      {
        id: "r11",
        name: "Tom Harris",
        rating: 4,
        date: "May 12, 2026",
        comment: "Great lamp with useful features. The wireless charging is a nice bonus.",
      },
    ],
  },
];

export const categories = [
  "All Products",
  "Audio",
  "Watches",
  "Wearables",
  "Accessories",
  "Photography",
];
