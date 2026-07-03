# Cine-Verse

A movie ticket booking system implemented in two forms — a web application built with JavaScript, and a console-based application built with C++. The project demonstrates core object-oriented programming concepts, modular software design, and a complete booking workflow from browsing to reservation.

**Live Demo:** [cine-verse-eicr.vercel.app](https://cine-verse-eicr.vercel.app)

---

## Overview

Cine-Verse offers a straightforward platform for browsing available movies and booking tickets. The repository includes two independent implementations of the same core idea, built to explore the problem from both a web-development and a systems-level programming perspective:

- **Web Application** — A browser-based booking interface built with HTML, CSS, and JavaScript.
- **Console Application** — A C++ implementation focused on object-oriented design, encapsulation, and file-based data persistence.

---

## Features

- Browse available movies and view details
- Book and cancel tickets
- Object-oriented architecture with clear separation of concerns
- Independent web and console implementations of the same domain logic
- File handling for persistent data storage (C++ version)
- Thread synchronization for safe concurrent booking (C++ version)

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js |
| Console Application | C++ (OOP, STL, Multithreading) |
| Version Control | Git, GitHub |
| Deployment | Vercel |

---

## Project Structure

```
CINE-VERSE/
│
├── CPP Version/
│   └── main.cpp
│
├── index.html
├── script.js
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for the web application)
- A C++ compiler such as `g++` (for the console application)

### Clone the Repository
```bash
git clone https://github.com/AmirHussain-17/CINE-VERSE.git
cd CINE-VERSE
```

### Running the Web Application
Open `index.html` directly in a browser, or serve it locally:
```bash
npm install
npm start
```

### Running the Console Application
```bash
cd "CPP Version"
g++ main.cpp -o cineverse
./cineverse
```

---

## Concepts Demonstrated

- Object-oriented design: encapsulation, inheritance, and polymorphism
- Modular and maintainable code architecture
- File handling for persistent storage
- Multithreading and synchronization using mutex locks
- Fundamentals of web application development
- Git-based version control workflow

---

## Roadmap

Planned improvements for future iterations:

- [ ] User authentication and account management
- [ ] Online payment integration
- [ ] Database-backed storage (replacing file handling)
- [ ] Movie search and filtering
- [ ] Booking history for users
- [ ] Admin dashboard for managing listings

---

## Author

**Amir Hussain**
GitHub: [@AmirHussain-17](https://github.com/AmirHussain-17)

---

If you found this project useful, consider giving it a star on GitHub.