import emailjs from '@emailjs/browser';

// ==========================================
// EMAIL CONFIGURATION
// ==========================================
// 1. Go to https://www.emailjs.com/ and create an account (it's free).
// 2. Add an Email Service (e.g., connect your Gmail). Copy the "Service ID".
// 3. Create an Email Template. Copy the "Template ID".
//    - In the template, use variables like: {{to_name}}, {{to_email}}, {{test_code}}, {{scenario_name}}
// 4. Go to Account > API Keys. Copy the "Public Key".

const SERVICE_ID = 'service_6mgldm7';
const TEMPLATE_ID = 'template_dmhwkmd';
const PUBLIC_KEY = 'jI_4SqluqXOskWD9L';

// Added companyId to parameters so it can be used in the message
export const sendTestAssignmentEmail = async (employeeEmail, employeeName, testCode, scenario, companyId) => {
  console.log(`Attempting to send email to ${employeeEmail}...`);

  const templateParams = {
    to_email: employeeEmail,   // Variable in EmailJS template: {{to_email}}
    to_name: employeeName,     // Variable in EmailJS template: {{to_name}}
    test_code: testCode,       // Variable in EmailJS template: {{test_code}}
    company: companyId,
    message: `Hello ${employeeName}, You have been assigned a new bias detection test from ${companyId}. Please enter code ${testCode} in your watch app to take the test.`
  };

  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('SUCCESS!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('FAILED...', error);
    alert("Failed to send email. Check console for details.");
    return false;
  }
};