/**
 * InsightFlow — Built-in demo datasets
 * Realistic sample data for Retail, HR, and Netflix analytics.
 */

const DemoData = (() => {
  // ---------- Retail Sales ----------
  function generateRetail() {
    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Beauty', 'Books'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const products = {
      Electronics: ['Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Smartwatch'],
      Clothing: ['T-Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Dress'],
      'Home & Kitchen': ['Blender', 'Coffee Maker', 'Cookware Set', 'Vacuum', 'Lamp'],
      Sports: ['Yoga Mat', 'Dumbbells', 'Running Shoes', 'Bicycle', 'Tennis Racket'],
      Beauty: ['Skincare Set', 'Perfume', 'Hair Dryer', 'Makeup Kit', 'Face Mask'],
      Books: ['Fiction Novel', 'Self-Help', 'Cookbook', 'Biography', 'Textbook'],
    };
    const rows = [];
    const start = new Date('2024-01-01');
    for (let i = 0; i < 200; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const prod = products[cat][Math.floor(Math.random() * products[cat].length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const dayOffset = Math.floor(Math.random() * 365);
      const d = new Date(start);
      d.setDate(d.getDate() + dayOffset);
      const qty = Math.floor(Math.random() * 8) + 1;
      const unitPrice = +(Math.random() * 400 + 15).toFixed(2);
      const revenue = +(qty * unitPrice).toFixed(2);
      const cost = +(revenue * (0.4 + Math.random() * 0.3)).toFixed(2);
      const profit = +(revenue - cost).toFixed(2);
      const customerId = 'C' + String(Math.floor(Math.random() * 800) + 1).padStart(4, '0');
      rows.push({
        OrderID: 'ORD' + String(1000 + i),
        Date: d.toISOString().slice(0, 10),
        Category: cat,
        Product: prod,
        Region: region,
        Quantity: qty,
        UnitPrice: unitPrice,
        Revenue: revenue,
        Cost: cost,
        Profit: profit,
        CustomerID: customerId,
      });
    }
    // Sort by date
    rows.sort((a, b) => a.Date.localeCompare(b.Date));
    return {
      name: 'Retail Sales',
      source: 'demo:retail',
      data: rows,
    };
  }

  // ---------- HR Analytics ----------
  function generateHR() {
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support'];
    const roles = {
      Engineering: ['Software Engineer', 'Data Analyst', 'DevOps', 'Product Manager', 'QA Engineer'],
      Sales: ['Account Exec', 'Sales Rep', 'Sales Manager', 'BDR'],
      Marketing: ['Content Writer', 'SEO Specialist', 'Marketing Manager', 'Designer'],
      HR: ['Recruiter', 'HR Manager', 'People Ops'],
      Finance: ['Accountant', 'Financial Analyst', 'Controller'],
      Operations: ['Ops Manager', 'Coordinator', 'Logistics'],
      Support: ['Support Agent', 'Support Lead', 'CSM'],
    };
    const locations = ['New York', 'San Francisco', 'London', 'Berlin', 'Remote', 'Austin', 'Toronto'];
    const genders = ['Male', 'Female', 'Non-binary'];
    const rows = [];
    for (let i = 0; i < 150; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const role = roles[dept][Math.floor(Math.random() * roles[dept].length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const age = Math.floor(Math.random() * 35) + 22;
      const tenure = +(Math.random() * 10).toFixed(1);
      const salary = Math.floor(Math.random() * 90000) + 45000;
      const performance = +(Math.random() * 2 + 3).toFixed(1); // 3.0–5.0
      const satisfaction = Math.floor(Math.random() * 5) + 1;
      const attrition = Math.random() < 0.18 ? 'Yes' : 'No';
      const hireYear = 2024 - Math.floor(tenure);
      const hireMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      rows.push({
        EmployeeID: 'EMP' + String(1001 + i),
        Department: dept,
        Role: role,
        Location: location,
        Gender: gender,
        Age: age,
        TenureYears: tenure,
        Salary: salary,
        PerformanceScore: performance,
        SatisfactionScore: satisfaction,
        Attrition: attrition,
        HireDate: `${hireYear}-${hireMonth}-15`,
      });
    }
    return {
      name: 'HR Analytics',
      source: 'demo:hr',
      data: rows,
    };
  }

  // ---------- Netflix Analytics ----------
  function generateNetflix() {
    const genres = ['Drama', 'Comedy', 'Action', 'Thriller', 'Documentary', 'Sci-Fi', 'Romance', 'Horror'];
    const types = ['Movie', 'TV Show'];
    const countries = ['United States', 'India', 'United Kingdom', 'South Korea', 'Japan', 'Spain', 'Canada', 'France'];
    const ratings = ['TV-MA', 'TV-14', 'PG-13', 'R', 'TV-PG', 'PG', 'G'];
    const titles = {
      Drama: ['The Crown', 'Stranger Stories', 'Dark Horizon', 'Silent Echo', 'Broken Ties'],
      Comedy: ['Laugh Track', 'Office Hours', 'Weekend Vibes', 'Funny Business', 'Stand Up Night'],
      Action: ['Night Hunter', 'Speed Force', 'Last Stand', 'Bullet Train', 'Shadow Ops'],
      Thriller: ['The Watcher', 'Mind Games', 'Vanished', 'Edge of Fear', 'Blackout'],
      Documentary: ['Planet Earth Live', 'Tech Revolution', 'Ocean Depths', 'True Crime Files', 'Space Odyssey'],
      'Sci-Fi': ['Quantum Leap', 'Neon City', 'After Earth', 'Time Warp', 'Alien Protocol'],
      Romance: ['Love Letters', 'Paris Nights', 'Second Chance', 'Heart Strings', 'Forever Yours'],
      Horror: ['Haunted Manor', 'Midnight Screams', 'The Entity', 'Blood Moon', 'Dead Silence'],
    };
    const rows = [];
    for (let i = 0; i < 180; i++) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const title = titles[genre][Math.floor(Math.random() * titles[genre].length)] + ' ' + (i % 5 === 0 ? 'II' : '');
      const type = types[Math.floor(Math.random() * types.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      const rating = ratings[Math.floor(Math.random() * ratings.length)];
      const year = Math.floor(Math.random() * 10) + 2015;
      const duration = type === 'Movie'
        ? Math.floor(Math.random() * 90) + 80
        : Math.floor(Math.random() * 8) + 1; // seasons
      const views = Math.floor(Math.random() * 50e6) + 1e5;
      const imdb = +(Math.random() * 3.5 + 5.5).toFixed(1);
      const revenue = +(views * (0.001 + Math.random() * 0.004)).toFixed(0); // rough $ estimate
      rows.push({
        TitleID: 'NF' + String(2000 + i),
        Title: title,
        Type: type,
        Genre: genre,
        Country: country,
        Rating: rating,
        ReleaseYear: year,
        Duration: duration,
        DurationUnit: type === 'Movie' ? 'min' : 'seasons',
        Views: views,
        IMDbScore: imdb,
        EstRevenue: revenue,
      });
    }
    rows.sort((a, b) => b.Views - a.Views);
    return {
      name: 'Netflix Analytics',
      source: 'demo:netflix',
      data: rows,
    };
  }

  function get(key) {
    switch (key) {
      case 'retail':
        return generateRetail();
      case 'hr':
        return generateHR();
      case 'netflix':
        return generateNetflix();
      default:
        return null;
    }
  }

  return { get, generateRetail, generateHR, generateNetflix };
})();

window.DemoData = DemoData;
