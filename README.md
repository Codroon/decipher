# Decipher - AI Storytelling Platform

A modern, responsive web application for AI-powered storytelling with an immersive user interface. Built with React, featuring authentication, routing, and a comprehensive suite of creative tools.

## 🚀 Features

### 🎨 **Modern UI/UX**
- **Dark Theme**: Purple gradient design with glowing effects
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: CSS transitions and hover effects
- **Custom Components**: Tailored UI components for storytelling

### 🔐 **Authentication System**
- **Secure Login**: Email/password authentication
- **Session Management**: Persistent login across browser sessions
- **Protected Routes**: Automatic redirect to login for unauthorized access
- **User Profile**: Dropdown with user info and logout functionality

### 📱 **Core Pages**

#### **Home Dashboard**
- **Hero Section**: Interactive image carousel with 5 images
- **Story Cards**: Previously played and shared stories
- **Notification Banner**: System updates and announcements
- **Pagination**: Easy navigation through story collections

#### **Story Creator**
- **Rich Text Editor**: AI-powered story writing interface
- **Character Management**: Create and manage story characters
- **World Building**: Design story settings and locations
- **AI Assistant**: Integrated chatbot for creative guidance
- **Story Controls**: Adjust creativity level, length, and tone
- **Real-time Stats**: Word count, reading time, and progress tracking

#### **Image Studio**
- **AI Image Generation**: Create visuals for your stories
- **Art Style Selection**: Multiple artistic styles (Fantasy, Realistic, etc.)
- **Image Sizing**: Square, Portrait, and Landscape formats
- **Recent Images**: Gallery of previously generated images
- **Tab Navigation**: Creatures, Characters, Locations, References, Library

#### **Settings**
- **Theme Customization**: Dark, Light, and Custom color themes
- **Color Picker**: Advanced color selection with presets
- **Preferences**: Animations, Particles, Sound Effects toggles
- **Language & Region**: Multi-language support and timezone settings

### 🧭 **Navigation**
- **Sidebar Navigation**: Collapsible sidebar with smooth animations
- **React Router**: URL-based navigation with browser history
- **Breadcrumb Navigation**: Clear page hierarchy
- **Mobile Responsive**: Touch-friendly navigation on mobile devices

## 🛠️ **Technology Stack**

- **Frontend**: React 18 with Hooks
- **Routing**: React Router DOM v6
- **Styling**: CSS3 with custom properties
- **State Management**: React Context API
- **Authentication**: Custom AuthContext with localStorage
- **Build Tool**: Vite
- **Package Manager**: npm

## 📦 **Installation**

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Decipher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🔑 **Authentication**

### Login Credentials
- **Email**: `admin` or `admin@decipher.com`
- **Password**: `admin`

### Features
- **Automatic Redirect**: Unauthenticated users are redirected to login
- **Session Persistence**: Login state persists across browser sessions
- **Secure Logout**: Complete session cleanup on logout

## 📱 **Responsive Design**

### Breakpoints
- **Desktop**: 1280px and above
- **Tablet**: 768px - 1279px
- **Mobile**: Below 768px

### Mobile Features
- **Touch Navigation**: Swipe gestures for carousel
- **Collapsible Sidebar**: Overlay sidebar on mobile
- **Optimized Forms**: Touch-friendly input fields
- **Responsive Images**: Auto-scaling images

## 🎨 **Design System**

### Color Palette
- **Primary**: `#7738CB` (Purple)
- **Secondary**: `#4D70FF` (Blue)
- **Background**: `#3D1162` (Dark Purple)
- **Text**: `#FFFFFF` (White)
- **Accent**: `#925ED5` (Light Purple)

### Typography
- **Font Family**: Poppins (Google Fonts)
- **Weights**: 400, 500, 600, 700, 800
- **Responsive Sizing**: Fluid typography scales

### Components
- **Buttons**: Gradient backgrounds with glow effects
- **Cards**: Glass-morphism with subtle borders
- **Forms**: Custom styled inputs with validation
- **Modals**: Overlay popups with smooth animations

## 🚀 **Available Scripts**

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 📁 **Project Structure**

```
src/
├── components/          # React components
│   ├── Home.jsx        # Dashboard page
│   ├── StoryCreator.jsx # Story creation interface
│   ├── ImageStudio.jsx # Image generation tools
│   ├── Settings.jsx    # User preferences
│   ├── Sidebar.jsx     # Navigation sidebar
│   └── LoginForm.jsx   # Authentication form
├── contexts/           # React Context providers
│   └── AuthContext.jsx # Authentication state
├── App.jsx            # Main application component
├── App.css            # Global styles
└── main.jsx           # Application entry point
```

## 🔧 **Configuration**

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_APP_NAME=Decipher
VITE_APP_VERSION=1.0.0
```

### Customization
- **Colors**: Modify CSS custom properties in `App.css`
- **Fonts**: Update font imports in `index.html`
- **Images**: Replace images in `public/` directory

## 🐛 **Troubleshooting**

### Common Issues

1. **Login not working**
   - Ensure you're using the correct credentials
   - Check browser console for errors
   - Clear localStorage and try again

2. **Images not loading**
   - Verify image paths in `public/` directory
   - Check file permissions
   - Ensure correct file extensions

3. **Styling issues**
   - Clear browser cache
   - Check CSS file imports
   - Verify responsive breakpoints

### Browser Support
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 **Team**

- **Frontend Development**: React & CSS
- **UI/UX Design**: Custom component library
- **Authentication**: Custom AuthContext implementation

## 📞 **Support**

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ using React and modern web technologies**