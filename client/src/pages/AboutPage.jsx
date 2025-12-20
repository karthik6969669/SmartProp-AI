import "./AboutPage.css";

export default function AboutPage() {
  return (
    <div className="page about-page">
      <h2>About SmartProp AI</h2>
      <p className="intro">
        SmartProp AI is an intelligent real estate platform that helps buyers and sellers 
        make informed decisions using machine learning and real-time market data.
      </p>

      <section>
        <h3>🎯 What You Can Do</h3>
        <ul>
          <li>List your house or land with photos and detailed information</li>
          <li>Browse Buy House and Buy Land listings with AI price estimates</li>
          <li>Use dedicated prediction forms for instant property valuations</li>
          <li>Explore Market Insights to track trends, averages, and listing activity</li>
        </ul>
      </section>

      <section>
        <h3>🚀 Features</h3>
        <ul>
          <li><strong>AI-Powered Predictions:</strong> Advanced algorithms analyze multiple factors</li>
          <li><strong>Real-Time Data:</strong> Live market updates and property listings</li>
          <li><strong>Image Management:</strong> Upload and view multiple property photos</li>
          <li><strong>Location Intelligence:</strong> Interactive maps with Google Maps integration</li>
        </ul>
      </section>

      <section>
        <h3>🛠️ Technology Stack</h3>
        <ul>
          <li><strong>Frontend:</strong> React with React Router</li>
          <li><strong>Backend:</strong> Flask (Port 5000 for listings, Port 5002 for predictions)</li>
          <li><strong>Database:</strong> MongoDB with GridFS for image storage</li>
          <li><strong>ML Models:</strong> Trained on local real estate data</li>
        </ul>
      </section>

      <section>
        <h3>📧 Contact</h3>
        <p>For support or inquiries: <a href="mailto:smartpropaiproject@gmail.com">smartpropaiproject@gmail.com</a></p>
      </section>
    </div>
  );
}
