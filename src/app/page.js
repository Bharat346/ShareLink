'use client';

import NavigationComponent from '../components/Navigation.component';
import FooterComponent from '../components/Footer.component';
import FileTransfer from '../components/FileTransfer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavigationComponent />
      <section className="flex-grow pt-8">
        <FileTransfer />
      </section>
      <FooterComponent />
    </div>
  );
}
