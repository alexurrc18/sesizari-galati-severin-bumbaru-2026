export default function ProfilPage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-bold text-dark-blue">Profilul meu</h1>

      <div className="flex flex-col gap-4">

        <div className="flex gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Nume</label>
            <input
              type="text"
              placeholder="Numele tău"
              className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
            />
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Prenume</label>
            <input
              type="text"
              placeholder="Prenumele tău"
              className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Email</label>
          <input
            type="email"
            placeholder="email@exemplu.ro"
            className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">Număr de telefon</label>
          <input
            type="tel"
            placeholder="07xx xxx xxx"
            className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none border-2 border-transparent focus:border-blue/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-blue uppercase tracking-widest ml-1">CNP</label>
          <input
            type="text"
            placeholder="xxxxxxxxxxxxx"
            disabled
            className="w-full p-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-400 border-2 border-transparent cursor-not-allowed select-none"
          />
          <span className="text-xs text-gray-400 ml-1">CNP-ul nu poate fi modificat.</span>
        </div>

        <button className="mt-2 w-full bg-orange hover:bg-orange-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
          Salvează modificările
        </button>

      </div>
    </div>
  );
}