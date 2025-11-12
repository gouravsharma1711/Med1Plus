import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserAlt, FaLock, FaChevronRight, FaAccessibleIcon, FaSearch, FaInfoCircle, FaFileAlt, FaPhone, FaEnvelope, FaQuestionCircle } from "react-icons/fa";
import GridPattern from "./GridPattern";

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginClick = () => navigate("/login");
  const handleSignupClick = () => navigate("/signup");

  const carouselItems = [
    {
      title: "Digital Health Records",
      description: "Access your medical history securely with facial recognition technology",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      color: "#1a3a5f"
    },
    {
      title: "Secure Document Storage",
      description: "Store and access your important medical documents anytime, anywhere",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      color: "#2c5282"
    },
    {
      title: "Government Authorized",
      description: "Official platform for citizens to manage their healthcare documents",
      image: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      color: "#1e3a5f"
    }
  ];

  const quickLinks = [
    { icon: <FaFileAlt />, text: "Apply for Health Card", url: "#" },
    { icon: <FaAccessibleIcon />, text: "Disability Services", url: "#" },
    { icon: <FaSearch />, text: "Find Healthcare Provider", url: "#" },
    { icon: <FaInfoCircle />, text: "COVID-19 Information", url: "#" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* National Emblem and Header */}
      <div className="bg-blue-900 text-white py-1 text-center text-xs">
          Smart Healthcare Solutions | Empowering Citizens Since 20XX
      </div>

      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="https://res.cloudinary.com/dyg2kv4z4/image/upload/v1760036497/Med1plus_nbuahc.png"
              alt="National Emblem"
              className="h-12 mr-3"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-900">Med1Plus</h1>
              <p className="text-xs text-gray-600">Smart Health Records System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className={`${screenWidth < 1024 ? 'hidden' : 'flex'} items-center space-x-6`}>
            <a href="#" className="text-blue-900 hover:text-blue-700 font-medium">Home</a>
            <a href="#" className="text-blue-900 hover:text-blue-700 font-medium">About</a>
            <a href="#" className="text-blue-900 hover:text-blue-700 font-medium">Services</a>
            <a href="#" className="text-blue-900 hover:text-blue-700 font-medium">Contact</a>
            <div className="flex space-x-2">
              <motion.button
                onClick={handleLoginClick}
                className="bg-blue-800 text-white px-4 py-2 rounded flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaUserAlt className="mr-2" /> Login
              </motion.button>
              <motion.button
                onClick={handleSignupClick}
                className="bg-green-700 text-white px-4 py-2 rounded flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaLock className="mr-2" /> Register
              </motion.button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          {screenWidth < 1024 && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-blue-900 p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && screenWidth < 1024 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border-t border-gray-200"
            >
              <div className="container mx-auto px-4 py-2 flex flex-col space-y-3">
                <a href="#" className="text-blue-900 py-2 border-b border-gray-100">Home</a>
                <a href="#" className="text-blue-900 py-2 border-b border-gray-100">About</a>
                <a href="#" className="text-blue-900 py-2 border-b border-gray-100">Services</a>
                <a href="#" className="text-blue-900 py-2 border-b border-gray-100">Contact</a>
                <div className="flex flex-col space-y-2 pt-2">
                  <motion.button
                    onClick={handleLoginClick}
                    className="bg-blue-800 text-white px-4 py-2 rounded flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaUserAlt className="mr-2" /> Login
                  </motion.button>
                  <motion.button
                    onClick={handleSignupClick}
                    className="bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaLock className="mr-2" /> Register
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        {/* Hero Carousel */}
        <div className="relative h-[500px] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <GridPattern
              width={40}
              height={40}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={1}
            />
          </div>

          <div className="relative h-full">
            {carouselItems.map((item, index) => (
              <motion.div
                key={index}
                className="absolute inset-0 flex items-center"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: currentSlide === index ? 1 : 0,
                  zIndex: currentSlide === index ? 10 : 0
                }}
                transition={{ duration: 0.8 }}
                style={{
                  backgroundImage: `linear-gradient(to right, ${item.color} 0%, ${item.color}99 50%, ${item.color}40 100%), url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="container mx-auto px-6 md:px-12 flex flex-col items-start justify-center h-full text-white">
                  <motion.h2
                    className="text-3xl md:text-5xl font-bold mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: currentSlide === index ? 1 : 0, y: currentSlide === index ? 0 : 20 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {item.title}
                  </motion.h2>
                  <motion.p
                    className="text-lg md:text-xl mb-8 max-w-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: currentSlide === index ? 1 : 0, y: currentSlide === index ? 0 : 20 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {item.description}
                  </motion.p>
                  <motion.button
                    className="bg-white text-blue-900 px-6 py-3 rounded-md font-semibold flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: currentSlide === index ? 1 : 0, y: currentSlide === index ? 0 : 20 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    onClick={handleSignupClick}
                  >
                    Get Started <FaChevronRight className="ml-2" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 z-20">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Quick Links Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-900 mb-10">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.url}
                  className="flex flex-col items-center p-6 bg-blue-50 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-3xl text-blue-800 mb-4">{link.icon}</div>
                  <h3 className="text-lg font-medium text-blue-900 text-center">{link.text}</h3>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-900 mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                className="bg-white p-6 rounded-lg shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 text-2xl mb-4 mx-auto">
                  <FaLock />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 text-center mb-3">Secure Access</h3>
                <p className="text-gray-600 text-center">
                  Advanced facial recognition technology ensures only you can access your medical records.
                </p>
              </motion.div>

              <motion.div
                className="bg-white p-6 rounded-lg shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 text-2xl mb-4 mx-auto">
                  <FaFileAlt />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 text-center mb-3">Document Management</h3>
                <p className="text-gray-600 text-center">
                  Upload, organize, and access your medical documents from anywhere, anytime.
                </p>
              </motion.div>

              <motion.div
                className="bg-white p-6 rounded-lg shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 text-2xl mb-4 mx-auto">
                  <FaUserAlt />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 text-center mb-3">User-Friendly</h3>
                <p className="text-gray-600 text-center">
                  Intuitive interface designed for citizens of all ages and technical abilities.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-blue-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Secure Your Medical Records?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join millions of citizens who trust MediSecure for their healthcare document management.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                onClick={handleSignupClick}
                className="bg-white text-blue-900 px-8 py-3 rounded-md font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Register Now
              </motion.button>
              <motion.button
                onClick={handleLoginClick}
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">MediSecure</h3>
              <p className="text-gray-400 text-sm">
                Official platform of the Government of India for secure medical record management.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Home</a></li>
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Services</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Help & Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">FAQs</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Helpdesk</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center"><FaPhone className="mr-2" /> 1800-XXX-XXXX (Toll Free)</li>
                <li className="flex items-center"><FaEnvelope className="mr-2" /> support@medisecure.gov.in</li>
                <li className="flex items-center"><FaQuestionCircle className="mr-2" /> Submit a Query</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} MediSecure. All rights reserved. Government of India.</p>
            <p className="mt-2">This website is designed and maintained by National Informatics Centre (NIC)</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
