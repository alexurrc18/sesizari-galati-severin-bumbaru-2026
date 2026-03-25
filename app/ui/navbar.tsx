import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full px-16 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Logo Galați" width={120} height={50} priority />
      </div>

      <div className="flex items-center gap-6">
        <Link href="/filtrare" className="text-s font-bold font-sans text-dark-blue hover:text-blue">
          Filtrare
        </Link>
        <Link href="/sesizari/nou" className="text-s font-bold font-sans text-dark-blue hover:text-blue">
          Adaugă sesizare
        </Link>
        
        <Link href="/sesizari/nou" className="bg-blue text-white px-5 py-2.5 text-s font-bold flex items-center gap-2 hover:bg-blue-500 transition">
          <span>+</span>
          Adaugă sesizare
        </Link>
      </div>
    </nav>
  );
}