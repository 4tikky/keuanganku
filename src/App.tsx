import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  BarChart3, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Search, 
  Filter, 
  XCircle, 
  Trash2, 
  Pencil, 
  Save, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Target, 
  AlertCircle, 
  PieChart,
  Settings,
  Flag
} from 'lucide-react';

// --- TIPE DATA ---
type PriorityLevel = 'Tinggi' | 'Sedang' | 'Rendah';

type Transaction = {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  priority: PriorityLevel; // Field baru
};

type ViewMode = 'dashboard' | 'transactions' | 'add' | 'analysis';

// --- KONSTANTA ---
const EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Skincare', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Lainnya'];
const INCOME_CATEGORIES = ['Gaji', 'Bonus', 'Investasi', 'Freelance', 'Lainnya'];
const PRIORITIES: PriorityLevel[] = ['Tinggi', 'Sedang', 'Rendah'];

const CATEGORY_COLORS: Record<string, string> = {
  'Makanan': '#F87171', 'Transportasi': '#60A5FA', 'Belanja': '#FBBF24',
  'Tagihan': '#34D399', 'Hiburan': '#A78BFA', 'Kesehatan': '#F472B6', 'Lainnya': '#94A3B8'
};

const PRIORITY_STYLES: Record<PriorityLevel, string> = {
  'Tinggi': 'bg-red-100 text-red-700 border-red-200',
  'Sedang': 'bg-amber-100 text-amber-700 border-amber-200',
  'Rendah': 'bg-blue-100 text-blue-700 border-blue-200'
};

// --- HELPER FUNCTIONS ---
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(number);
};

export default function App() {
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('financeData');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrasi data lama yang belum punya priority
      return parsed.map((t: any) => ({ ...t, priority: t.priority || 'Sedang' }));
    }
    return [
      { id: 1, date: '2023-10-01', description: 'Gaji Bulanan', category: 'Gaji', amount: 8500000, type: 'income', priority: 'Tinggi' },
      { id: 2, date: '2023-10-02', description: 'Belanja Bulanan', category: 'Belanja', amount: 1500000, type: 'expense', priority: 'Sedang' },
    ];
  });

  // Global Budget (Total)
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('monthlyBudget');
    return saved ? parseFloat(saved) : 5000000;
  });

  // Category Budgets (Per Kategori)
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('categoryBudgets');
    // Default budget 0 (artinya tidak diset)
    return saved ? JSON.parse(saved) : {};
  });

  // State untuk Edit (Shared antara List dan Form)
  const [editData, setEditData] = useState<Transaction | null>(null);

  // Global Filters (Agar user tidak perlu set ulang saat pindah menu)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // --- EFFECT ---
  useEffect(() => { localStorage.setItem('financeData', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('monthlyBudget', monthlyBudget.toString()); }, [monthlyBudget]);
  useEffect(() => { localStorage.setItem('categoryBudgets', JSON.stringify(categoryBudgets)); }, [categoryBudgets]);

  // --- DATA PROCESSING (Global Calculation) ---
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const filteredByDate = transactions.filter((t) => {
    const tDate = new Date(t.date);
    const monthMatch = filterMonth === 'Semua' || tDate.getMonth().toString() === filterMonth;
    const yearMatch = filterYear === 'Semua' || tDate.getFullYear().toString() === filterYear;
    return monthMatch && yearMatch;
  });

  const totalIncome = filteredByDate.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredByDate.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  // --- HANDLERS ---
  const handleDelete = (id: number) => {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      if (editData?.id === id) setEditData(null);
    }
  };

  const startEdit = (t: Transaction) => {
    setEditData(t);
    setActiveTab('add'); // Pindah ke tab form
  };

  const updateCategoryBudget = (category: string, amount: number) => {
    // Validasi: Hitung total budget kategori LAINNYA dulu
    const otherCategoriesTotal = Object.entries(categoryBudgets)
      .filter(([key]) => key !== category)
      .reduce((acc, [, val]) => acc + val, 0);
    
    // Cek apakah input baru akan membuat total melebihi Budget Bulanan
    if (otherCategoriesTotal + amount > monthlyBudget) {
      alert(
        `Gagal menyimpan!\n\n` +
        `Total anggaran kategori tidak boleh melebihi Anggaran Total (${formatRupiah(monthlyBudget)}).\n` +
        `Sisa yang tersedia untuk dialokasikan: ${formatRupiah(Math.max(0, monthlyBudget - otherCategoriesTotal))}`
      );
      return; // Batalkan update
    }

    setCategoryBudgets(prev => ({ ...prev, [category]: amount }));
  };

  const downloadCSV = () => {
    const headers = ['Tanggal,Keterangan,Kategori,Prioritas,Tipe,Jumlah'];
    const rows = filteredByDate.map(t => 
      `${t.date},"${t.description}",${t.category},${t.priority},${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'},${t.amount}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SUB-COMPONENTS (VIEWS) ---

  // 1. DASHBOARD VIEW
  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Saldo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Wallet className="w-5 h-5 text-blue-600" /></div>
            <span className="text-slate-500 font-medium text-sm">Sisa Saldo</span>
          </div>
          <div className={`text-2xl font-bold ${balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatRupiah(balance)}</div>
        </div>
        {/* Card Pemasukan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-slate-500 font-medium text-sm">Total Pemasukan</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatRupiah(totalIncome)}</div>
        </div>
        {/* Card Pengeluaran */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-100 rounded-lg"><TrendingDown className="w-5 h-5 text-rose-600" /></div>
            <span className="text-slate-500 font-medium text-sm">Total Pengeluaran</span>
          </div>
          <div className="text-2xl font-bold text-rose-600">{formatRupiah(totalExpense)}</div>
        </div>
      </div>

      {/* Budget Section (Global) */}
      <BudgetCard 
        title="Target Anggaran Total"
        currentExpense={totalExpense} 
        budget={monthlyBudget} 
        setBudget={setMonthlyBudget} 
      />
      
      {/* Empty State Helper */}
      {transactions.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center">
          <h3 className="text-blue-800 font-semibold text-lg mb-2">Selamat Datang di Keuanganku!</h3>
          <p className="text-blue-600 mb-4">Mulai kelola keuanganmu dengan mencatat transaksi pertama.</p>
          <button onClick={() => setActiveTab('add')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Tambah Transaksi Baru
          </button>
        </div>
      )}
    </div>
  );

  // 2. FORM VIEW (ADD/EDIT)
  const FormView = () => {
    // Local state for form, initialized with editData if available
    const [formData, setFormData] = useState({
      date: editData?.date || new Date().toISOString().split('T')[0],
      description: editData?.description || '',
      category: editData?.category || 'Makanan',
      amount: editData?.amount?.toString() || '',
      type: editData?.type || 'expense' as 'income' | 'expense',
      priority: editData?.priority || 'Sedang' as PriorityLevel
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.description || !formData.amount) return;

      const payload: Transaction = {
        id: editData ? editData.id : Date.now(),
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        type: formData.type,
        priority: formData.priority
      };

      if (editData) {
        setTransactions(prev => prev.map(t => t.id === editData.id ? payload : t));
        setEditData(null);
      } else {
        setTransactions(prev => [payload, ...prev]);
      }
      
      // Reset or redirect
      alert(editData ? 'Data berhasil diperbarui!' : 'Data berhasil ditambahkan!');
      if (editData) setActiveTab('transactions'); // Kembali ke list setelah edit
      else {
        // Reset form for next input (keep priority default)
        setFormData({ ...formData, description: '', amount: '', priority: 'Sedang' });
      }
    };

    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-4">
          {editData ? <Pencil className="w-6 h-6 text-blue-600" /> : <PlusCircle className="w-6 h-6 text-blue-600" />}
          {editData ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipe Transaksi Switcher */}
          <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl">
             <button type="button" onClick={() => setFormData({...formData, type: 'income', category: 'Gaji'})}
              className={`py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <ArrowUpCircle className="w-4 h-4"/> Pemasukan
            </button>
            <button type="button" onClick={() => setFormData({...formData, type: 'expense', category: 'Makanan'})}
              className={`py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <ArrowDownCircle className="w-4 h-4"/> Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tanggal</label>
              <input type="date" required value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Kategori</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {(formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-600 mb-1">Prioritas</label>
             <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({...formData, priority: p})}
                    className={`flex-1 py-2 rounded-lg text-sm border font-medium transition ${formData.priority === p ? PRIORITY_STYLES[p] + ' ring-2 ring-offset-1 ring-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {p}
                  </button>
                ))}
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Keterangan</label>
            <input type="text" required placeholder="Contoh: Makan Siang, Beli Bensin..." value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
              <input type="number" required min="1" placeholder="0" value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full pl-10 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {editData && (
              <button type="button" onClick={() => { setEditData(null); setActiveTab('transactions'); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition">
                Batal
              </button>
            )}
            <button type="submit"
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-lg transition shadow-lg text-white ${editData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {editData ? <Save className="w-5 h-5"/> : <PlusCircle className="w-5 h-5"/>}
              {editData ? 'Update Data' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // 3. TRANSACTIONS LIST VIEW
  const TransactionsView = () => {
    const [search, setSearch] = useState('');
    // Split filters
    const [incomeFilter, setIncomeFilter] = useState('Semua');
    const [expenseFilter, setExpenseFilter] = useState('Semua');

    // Filter logic per list
    const incomeList = filteredByDate
      .filter(t => t.type === 'income')
      .filter(t => t.description.toLowerCase().includes(search.toLowerCase()))
      .filter(t => incomeFilter === 'Semua' || t.category === incomeFilter);

    const expenseList = filteredByDate
      .filter(t => t.type === 'expense')
      .filter(t => t.description.toLowerCase().includes(search.toLowerCase()))
      .filter(t => expenseFilter === 'Semua' || t.category === expenseFilter);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Search Bar only - Filter moved to tables */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari transaksi berdasarkan keterangan..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
        </div>

        <TransactionTable 
          data={incomeList} 
          title="Pemasukan" 
          isIncome={true} 
          onDelete={handleDelete} 
          onEdit={startEdit}
          categories={INCOME_CATEGORIES}
          filterValue={incomeFilter}
          onFilterChange={setIncomeFilter}
        />
        
        <TransactionTable 
          data={expenseList} 
          title="Pengeluaran" 
          isIncome={false} 
          onDelete={handleDelete} 
          onEdit={startEdit}
          categories={EXPENSE_CATEGORIES}
          filterValue={expenseFilter}
          onFilterChange={setExpenseFilter}
        />
      </div>
    );
  };

  // 4. ANALYSIS VIEW
  const AnalysisView = () => {
    // Group Expense by Category
    const expenseGroups = filteredByDate.filter(t => t.type === 'expense').reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const chartData = Object.entries(expenseGroups)
      .map(([cat, amount]) => ({ category: cat, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Hitung total alokasi
    const totalAllocated = Object.values(categoryBudgets).reduce((a, b) => a + b, 0);
    const unallocated = monthlyBudget - totalAllocated;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <BudgetCard 
          title="Target Anggaran Total"
          currentExpense={totalExpense} 
          budget={monthlyBudget} 
          setBudget={setMonthlyBudget} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <PieChart className="w-5 h-5 text-purple-600"/> Grafik Pengeluaran
             </h3>
             <DonutChart data={chartData} />
          </div>

          {/* Category Budgets */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Target className="w-5 h-5 text-indigo-600"/> Anggaran per Kategori
               </h3>
               {/* Indikator Sisa Alokasi */}
               <span className={`text-xs font-medium px-2 py-1 rounded border ${unallocated < 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  Sisa Alokasi: {formatRupiah(Math.max(0, unallocated))}
               </span>
             </div>

             <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                {EXPENSE_CATEGORIES.map(cat => {
                   const spent = expenseGroups[cat] || 0;
                   const budget = categoryBudgets[cat] || 0;
                   return (
                     <CategoryBudgetRow 
                        key={cat} 
                        category={cat} 
                        spent={spent} 
                        budget={budget} 
                        onUpdate={(val) => updateCategoryBudget(cat, val)} 
                     />
                   );
                })}
             </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN LAYOUT ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="bg-white border-r border-slate-200 w-full md:w-64 flex-shrink-0 flex flex-col sticky top-0 md:h-screen z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-blue-600" /> Keuanganku
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <MenuButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <MenuButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<List size={20}/>} label="Riwayat Transaksi" />
          <MenuButton active={activeTab === 'add'} onClick={() => { setEditData(null); setActiveTab('add'); }} icon={<PlusCircle size={20}/>} label="Tambah Data" />
          <MenuButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<BarChart3 size={20}/>} label="Analisis & Budget" />
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">© 2026 Financial App v1.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header (Global Filters) */}
        <header className="bg-white border-b border-slate-200 p-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Ringkasan Keuangan'}
              {activeTab === 'transactions' && 'Daftar Transaksi'}
              {activeTab === 'add' && 'Input Transaksi'}
              {activeTab === 'analysis' && 'Laporan Analisis'}
            </h2>
            <p className="text-xs text-slate-500">
              Periode: {filterMonth === 'Semua' ? 'Semua Bulan' : new Date(2024, parseInt(filterMonth), 1).toLocaleDateString('id-ID', { month: 'long' })} {filterYear}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             {/* Global Date Filters */}
             <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Semua">Semua Bulan</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleDateString('id-ID', { month: 'short' })}</option>)}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Semua">All Year</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={downloadCSV} title="Export CSV" className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition">
                <Download size={18} />
              </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
             {activeTab === 'dashboard' && <DashboardView />}
             {activeTab === 'transactions' && <TransactionsView />}
             {activeTab === 'add' && <FormView />}
             {activeTab === 'analysis' && <AnalysisView />}
          </div>
        </div>

      </main>
    </div>
  );
}

// --- SMALL REUSABLE COMPONENTS ---

const MenuButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
      ${active ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
    {icon} {label}
  </button>
);

const TransactionTable = ({ data, title, isIncome, onDelete, onEdit, categories, filterValue, onFilterChange }: any) => (
  <div className={`rounded-xl shadow-sm border overflow-hidden ${isIncome ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
    <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isIncome ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
      <div>
        <h3 className={`font-bold flex items-center gap-2 ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isIncome ? <ArrowUpCircle size={18}/> : <ArrowDownCircle size={18}/>} {title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          Total: {formatRupiah(data.reduce((acc: any, curr: any) => acc + curr.amount, 0))}
        </span>
      </div>
      
      {categories && (
        <select value={filterValue} onChange={(e) => onFilterChange(e.target.value)}
          className={`p-2 text-xs border rounded-lg outline-none focus:ring-2 bg-white/80 ${isIncome ? 'border-emerald-200 focus:ring-emerald-500' : 'border-rose-200 focus:ring-rose-500'}`}>
          <option value="Semua">Semua Kategori</option>
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
    </div>
    <div className="overflow-x-auto bg-white">
      {data.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm italic">Tidak ada data.</div> : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-3 font-medium">Tanggal</th>
              <th className="p-3 font-medium">Keterangan</th>
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 font-medium text-right">Jumlah</th>
              <th className="p-3 font-medium text-center">Prioritas</th>
              <th className="p-3 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-3 text-sm text-slate-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month:'short'})}</td>
                <td className="p-3 text-sm font-medium text-slate-800">{t.description}</td>
                <td className="p-3 text-sm"><span className="px-2 py-1 rounded text-xs border bg-slate-50 text-slate-500">{t.category}</span></td>
                <td className={`p-3 text-sm font-bold text-right whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{formatRupiah(t.amount)}</td>
                <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${PRIORITY_STYLES[t.priority] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {t.priority}
                    </span>
                </td>
                <td className="p-3 text-center flex items-center justify-center gap-1">
                  <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"><Pencil size={16} /></button>
                  <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const BudgetCard = ({ title, currentExpense, budget, setBudget }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [temp, setTemp] = useState('');
  const percent = budget > 0 ? Math.min((currentExpense / budget) * 100, 100) : 0;
  const remaining = budget - currentExpense;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg"><Target className="w-5 h-5 text-indigo-600" /></div>
          <div><h3 className="font-bold text-slate-800">{title || 'Target Anggaran'}</h3></div>
        </div>
        <button onClick={() => { setTemp(budget.toString()); setIsEditing(true); }} className="text-slate-400 hover:text-indigo-600"><Pencil size={16} /></button>
      </div>

      {isEditing ? (
        <div className="flex gap-2 mb-4">
          <input type="number" value={temp} onChange={e => setTemp(e.target.value)} className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
          <button onClick={() => { setBudget(parseFloat(temp)); setIsEditing(false); }} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">OK</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-slate-600">Terpakai: {formatRupiah(currentExpense)}</span>
            <span className="text-slate-900">Budget: {formatRupiah(budget)}</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className={`h-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="text-sm font-bold">{remaining >= 0 ? <span className="text-emerald-600">Sisa: {formatRupiah(remaining)}</span> : <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14}/> Over: {formatRupiah(Math.abs(remaining))}</span>}</div>
        </>
      )}
    </div>
  );
};

const CategoryBudgetRow = ({ category, spent, budget, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [temp, setTemp] = useState(budget.toString());
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  
  return (
    <div className="mb-4 last:mb-0">
       <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] || '#ccc' }}></div>
             <span className="text-sm font-medium text-slate-700">{category}</span>
          </div>
          <div className="flex items-center gap-2">
             {isEditing ? (
               <div className="flex items-center gap-1">
                 <input type="number" value={temp} onChange={e => setTemp(e.target.value)} 
                   className="w-20 p-1 text-xs border rounded focus:ring-1 focus:ring-blue-500" />
                 <button onClick={() => { onUpdate(parseFloat(temp) || 0); setIsEditing(false); }} className="text-emerald-600"><Save size={14}/></button>
               </div>
             ) : (
               <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500">{formatRupiah(spent)} / {budget > 0 ? formatRupiah(budget) : '∞'}</span>
                 <button onClick={() => setIsEditing(true)} className="text-slate-300 hover:text-slate-500"><Settings size={12}/></button>
               </div>
             )}
          </div>
       </div>
       {budget > 0 && (
         <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${percent >= 100 ? 'bg-red-500' : percent > 80 ? 'bg-yellow-400' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }}></div>
         </div>
       )}
    </div>
  );
}

const DonutChart = ({ data }: { data: { category: string, amount: number }[] }) => {
  if (data.length === 0) return <div className="text-center text-slate-400 py-8">Belum ada data pengeluaran.</div>;
  const total = data.reduce((acc, curr) => acc + curr.amount, 0);
  let cumulative = 0;
  
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
      <div className="relative w-48 h-48 flex-shrink-0">
        <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90 transform">
          {data.map((item) => {
            const percent = item.amount / total;
            const start = cumulative;
            cumulative += percent;
            const x1 = Math.cos(2 * Math.PI * start), y1 = Math.sin(2 * Math.PI * start);
            const x2 = Math.cos(2 * Math.PI * cumulative), y2 = Math.sin(2 * Math.PI * cumulative);
            const large = percent > 0.5 ? 1 : 0;
            const color = CATEGORY_COLORS[item.category] || '#94A3B8';
            return data.length === 1 ? <circle key={item.category} cx="0" cy="0" r="1" fill={color} /> : 
              <path key={item.category} d={`M 0 0 L ${x1} ${y1} A 1 1 0 ${large} 1 ${x2} ${y2} Z`} fill={color} stroke="white" strokeWidth="0.05"/>;
          })}
        </svg>
        <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full flex items-center justify-center text-xs font-bold text-slate-500">Total</div>
      </div>
      <div className="space-y-2 w-full max-w-xs">
        {data.map(item => (
          <div key={item.category} className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#94A3B8' }} />
              <span className="text-slate-700">{item.category}</span>
            </div>
            <span className="font-semibold text-slate-800">{formatRupiah(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};