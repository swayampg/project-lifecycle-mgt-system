import emailjs from '@emailjs/browser';

/**
 * Sends an email notification using EmailJS.
 * Uses environment variables for configuration.
 * 
 * @param {Object} params - The template parameters.
 */
export const sendEmailNotification = async ({ to_email, to_name, message_title, message_body, project_name }) => {
  const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!serviceId || !templateId || !publicKey) {
    console.error("EmailJS Error: Missing configuration keys.");
    if (!isProduction) {
      console.warn("Check your .env file for REACT_APP_EMAILJS_* keys.");
    } else {
      console.warn("Production Build Error: Environment variables not injected. Check GitHub Secrets and deploy workflow.");
    }
    return;
  }

  try {
    const templateParams = {
      to_email,
      to_name,
      message_title,
      message_body,
      project_name,
    };

    console.log(`Sending email to ${to_email} via EmailJS...`);
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('EmailJS Send Failed:', error);
    // Log more details if it's a known EmailJS error
    if (error?.text) console.error('EmailJS Error Detail:', error.text);
    throw error;
  }
};
