import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full mt-6 bg-text-main py-6 px-4">
      <div className="max-w-[1180px] w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-5 p-8 text-orange-50 bg-transparent rounded-none">
        <div>
          <div className="text-[#F2C9A7] text-xl font-black tracking-wider">TITAN</div>
          <p className="mt-2 text-[#E7D8C4] max-w-[56ch] leading-relaxed">
            A structured alcohol catalog built to grow from beer and wine into more categories without redesigning the core flow.
          </p>
        </div>

        <nav className="flex gap-4.5 flex-wrap" aria-label="Footer">
          <Link to="/catalog" className="text-orange-50 no-underline font-bold hover:text-[#F2C9A7] transition-colors">Catalog</Link>
          <Link to="/favorites" className="text-orange-50 no-underline font-bold hover:text-[#F2C9A7] transition-colors">Favorites</Link>
          <Link to="/recommendations" className="text-orange-50 no-underline font-bold hover:text-[#F2C9A7] transition-colors">Recommendations</Link>
        </nav>
      </div>
    </footer>
  );
}