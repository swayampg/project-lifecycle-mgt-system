import emailjs from '@emailjs/browser';

/**
 * Sends an email notification using EmailJS.
 * Uses environment variables for configuration.
 * 
 * @param {Object} params - The template parameters.
 * @param {string} params.to_email - Recipient email.
 * @param {string} params.to_name - Recipient name.
 * @param {string} params.message_title - Title of the notification.
 * @param {string} params.message_body - Detailed message content.
 * @param {string} params.project_name - Name of the project.
 */
export const sendEmailNotification = async ({ to_email, to_name, message_title, message_body, project_name }) => {
  const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

  console.log("Attempting to send email via EmailJS...");
  console.log("Service ID configured:", !!serviceId);
  console.log("Template ID configured:", !!templateId);
  console.log("Public Key configured:", !!publicKey);

  if (!serviceId || !templateId || !publicKey || serviceId.includes('_here')) {
    console.warn("EmailJS credentials not fully configured or still using placeholders. Email not sent.");
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

    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
