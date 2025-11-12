# Med1Plus
This project is a healthcare support website designed to make patient treatment faster and more effective in critical situations. In emergencies, doctors often struggle to access a patient’s medical history, which leads to delays and repeated full-body tests before making important decisions. This platform solves that problem by allowing healthcare providers to instantly fetch a user’s previous medical records through face recognition technology.

When a patient arrives at the hospital, their face can be scanned through the system. The platform then quickly identifies the patient and securely retrieves their past medical details such as previous illnesses, surgeries, allergies, and test results. This gives doctors immediate access to vital information without wasting precious time.

By providing quick access to medical history, the system helps doctors make faster, more accurate, and safer treatment decisions. It reduces the need for duplicate testing, lowers treatment costs, and most importantly, saves lives during emergencies.

This solution brings together technology and healthcare to create a smarter, more connected medical support system. With face scan authentication, patient history management becomes simple, secure, and highly reliable — offering both hospitals and patients a better healthcare experience.
# Arogya Netra Card Implementation

## Overview
The Arogya Netra Card is a digital health ID card issued to users of the MediSecure platform. It serves as a unique identifier for accessing healthcare services across government and registered private facilities.

## Features Implemented

### 1. User Model Updates
- Added `arogyaNetraCard` schema to the User model with the following fields:
  - `cardId`: Unique identifier for the card (format: AN-xxxxxx-xxxx)
  - `issueDate`: Date when the card was issued
  - `cardImage`: URL to the generated card image
  - `status`: Current status of the card (active, inactive, pending)

### 2. Card Generation
- Implemented a `generateArogyaNetraCard` function in the Auth controller that:
  - Creates a unique card ID using a timestamp and the last 4 digits of the user's Aadhar number
  - Generates a visual card using the Canvas API
  - Includes government branding, user details, and a QR code placeholder
  - Uploads the generated card to Cloudinary
  - Returns the card details to be stored with the user

### 3. User Dashboard Integration
- Added a card display section to the UserDashboard component
- Implemented card viewing and downloading functionality
- Displayed card details including ID, issue date, and status

### 4. Healthcare Professional Access
- Added an API endpoint to fetch user data by Arogya Netra Card ID
- Implemented security checks to ensure only healthcare professionals can access patient data
- Added card ID search functionality to the ProfessionalDashboard
- Enhanced the search results display to show card information

## Security Considerations
- Only healthcare professionals can search for patients using card IDs
- Aadhar numbers are partially masked for privacy
- Access to patient data is logged for audit purposes
- Card status can be managed (active/inactive) for access control

## Technical Implementation
- Used Canvas API for card generation
- Stored card images in Cloudinary
- Implemented RESTful API endpoints for card-related operations
- Added responsive UI components for card display and management

## Future Enhancements
- QR code generation with encrypted patient data
- Card revocation and renewal processes
- Integration with national health databases
- Mobile app support for card display
- Offline verification capabilities