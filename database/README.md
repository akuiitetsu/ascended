# Ascended Prototype - Escape the Lab Tech Edition

A web-based escape room game focused on technology and programming challenges.

## Prerequisites

- **XAMPP** (Apache + MySQL + PHP)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation & Setup

### 1. Install XAMPP
- Download from [https://www.apachefriends.org/](https://www.apachefriends.org/)
- Install to default location (usually `C:\xampp` on Windows)

### 2. Clone/Download Project
- Place this project in `d:\xampp\htdocs\ascended_prototype\`
- Ensure the folder structure matches the paths in the code

### 3. Start XAMPP Services
- Open **XAMPP Control Panel**
- Start **Apache** service
- Start **MySQL** service
- Both should show green "Running" status

### 4. Setup Database
Choose one of these methods:

#### Option A: Automatic Setup (Recommended)
```
http://localhost/ascended_prototype/database/setup.php
```

#### Option B: Manual phpMyAdmin
1. Open `http://localhost/phpmyadmin`
2. Click "Import" tab
3. Select `database/create_database.sql`
4. Click "Go"

### 5. Verify Installation
```
http://localhost/ascended_prototype/verify.php
```

## Running the Game

### Start the Application
1. Ensure XAMPP Apache and MySQL are running
2. Open your browser
3. Navigate to: `http://localhost/ascended_prototype/`

### Game Access Points
- **Main Game**: `http://localhost/ascended_prototype/index.html`
- **API Test**: `http://localhost/ascended_prototype/api/test`
- **Database Setup**: `http://localhost/ascended_prototype/database/setup.php`

## Project Structure
```
ascended_prototype/
├── index.php              # Main PHP entry point
├── index.html             # Game interface
├── config/
│   └── database.php       # Database configuration
├── database/
│   ├── create_database.sql
│   ├── setup.php          # Automated database setup
│   └── README.md          # Database instructions
└── static/
    ├── css/               # Stylesheets
    └── js/                # JavaScript files
```

## Troubleshooting

### Common Issues

1. **"Page not found" error**
   - Verify XAMPP Apache is running
   - Check the URL path is correct
   - Ensure project is in `htdocs` folder

2. **Database connection failed**
   - Verify MySQL is running in XAMPP
   - Run database setup again
   - Check `config/database.php` settings

3. **Game not loading**
   - Check browser console for JavaScript errors
   - Verify all static files are present
   - Clear browser cache

### XAMPP Port Conflicts
If port 80 or 3306 are in use:
- Change Apache port in XAMPP config
- Update URLs accordingly
- Check Windows services for conflicts

## Development

### File Locations
- **Game Logic**: `static/js/main.js`
- **Styles**: `static/css/main.css`
- **Database Config**: `config/database.php`

### Testing Mode
The game includes testing navigation buttons to jump between rooms for development purposes.