import { useState, useEffect, useMemo, useRef } from "react";
import {
  Bike, Milestone, TreePine, Cog, Shirt, Wrench, Search, X, Plus,
  Clock, MapPin, ChevronDown, Gavel, Tag, RotateCcw
} from "lucide-react";

// Dữ liệu mẫu ban đầu (Seed Data)
const SEED_LISTINGS = [
  {
    id: "1",
    title: "Xe đạp Road Specialized Tarmac SL7",
    category: "road",
    type: "auction",
    price: 45000000,
    currentBid: 48500000,
    bidsCount: 12,
    endTime: Date.now() + 4 * 3600000,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60",
    location: "TP. Hồ Chí Minh",
    condition: "95% (Like New)",
    seller: "Nguyễn Văn A",
    description: "Cần lên đời nên nhượng lại em Tarmac SL7 bản Shimano Ultegra Di2. Xe đi kỹ, bảo dưỡng định kỳ, không đâm đụng té ngã."
  },
  {
    id: "2",
    title: "Khung sườn Carbon Trek Emonda SLR",
    category: "parts",
    type: "buy_now",
    price: 32000000,
    image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500&auto=format&fit=crop&q=60",
    location: "Hà Nội",
    condition: "99% (New with box)",
    seller: "Trần Minh B",
    description: "Sườn Trek Emonda SLR siêu nhẹ, size 52 thích hợp cho người từ 1m68 - 1m75. Hàng chính hãng phân phối tại Việt Nam."
  },
  {
    id: "3",
    title: "Giày xe đạp Shimano RC702 - Size 42",
    category: "apparel",
    type: "buy_now",
    price: 31000000,
    image: "https://images.unsplash.com/photo-1544192240-4a34fed0104c?w=500&auto=format&fit=crop&q=60",
    location: "Đà Nẵng",
    condition: "90%",
    seller: "Lê Hoàng C",
    description: "Giày dùng được khoảng 6 tháng, đế carbon trầy nhẹ theo thời gian, khóa boa hoạt động hoàn hảo."
  }
];

const CATEGORIES = [
  { key: "all", label: "Tất cả", icon: Bike, grad: "from-blue-500 to-indigo-600" },
  { key: "road", label: "Xe Road", icon: Bike, grad: "from-red-500 to-orange-500" },
  { key: "mtb", label: "Xe MTB", icon: TreePine, grad: "from-green-500 to-emerald-600" },
  { key: "gravel", label: "Xe Gravel & CX", icon: Milestone, grad: "from-amber-500 to-yellow-600" },
  { key: "parts", label: "Phụ tùng", icon: Cog, grad: "from-purple-500 to-pink-500" },
  { key: "accessories", label: "Phụ kiện", icon: Wrench, grad: "from-teal-500 to-cyan-600" },
  { key: "apparel", label: "Trang phục", icon: Shirt, grad: "from-fuchsia-500 to-rose-500" }
];

export default function Spoke() {
  // Vá lỗi 1: Gán thẳng SEED_LISTINGS làm mảng mặc định ban đầu thay vì mảng rỗng để tránh bộ lọc bị lỗi logic
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [showSell, setShowSell] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [toast, setToast] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());
  const toastTimer = useRef(null);

  // Form đăng tin mới
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("road");
  const [newType, setNewType] = useState("buy_now");
  const [newPrice, setNewPrice] = useState("");
  const [newDuration, setNewDuration] = useState("24");
  const [newLocation, setNewLocation] = useState("TP. Hồ Chí Minh");
  const [newCondition, setNewCondition] = useState("100% (New)");
  const [newDescription, setNewDescription] = useState("");

  // Giá đấu mới
  const [bidAmount, setBidAmount] = useState("");

  // Quản lý thời gian thực cho các tin đấu giá
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Đọc dữ liệu từ localStorage an toàn khi tải trang
  useEffect(() => {
    function load() {
      try {
        const savedData = localStorage.getItem("spoke:listings");
        if (savedData) {
          setListings(JSON.parse(savedData));
        } else {
          localStorage.setItem("spoke:listings", JSON.stringify(SEED_LISTINGS));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Lưu dữ liệu vào localStorage an toàn
  function persist(next) {
    setListings(next);
    try {
      localStorage.setItem("spoke:listings", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  }

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  // Bộ lọc và sắp xếp dữ liệu (Đã sửa lỗi tạo bản sao mảng để tránh biến đổi state gốc)
  const filtered = useMemo(() => {
    let res = Array.isArray(listings) ? [...listings] : [];
    if (category !== "all") res = res.filter((x) => x.category === category);
    if (type !== "all") res = res.filter((x) => x.type === type);
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter((x) => x.title.toLowerCase().includes(q) || x.description.toLowerCase().includes(q));
    }
    if (sort === "newest") res.reverse();
    else if (sort === "price_asc") res.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === "price_desc") res.sort((a, b) => (b.price || 0) - (a.price || 0));
    return res;
  }, [listings, category, type, search, sort]);

  // Xử lý đặt giá đấu
  function handleBid(e) {
    e.preventDefault();
    const amt = parseFloat(bidAmount);
    if (!amt || isNaN(amt)) return showToast("Vui lòng nhập giá hợp lệ");
    
    const currentPrice = selected.currentBid || selected.price;
    if (amt <= currentPrice) {
      return showToast("Giá đấu tiếp theo phải cao hơn giá hiện tại!");
    }

    const next = listings.map((x) => {
      if (x.id === selected.id) {
        const updated = {
          ...x,
          currentBid: amt,
          bidsCount: (x.bidsCount || 0) + 1
        };
        setSelected(updated);
        return updated;
      }
      return x;
    });
    persist(next);
    setBidAmount("");
    showToast("Đặt giá đấu thành công!");
  }

  // Xử lý đăng sản phẩm mới
  function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return showToast("Vui lòng điền đầy đủ thông tin");

    const item = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory,
      type: newType,
      price: parseFloat(newPrice),
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60",
      location: newLocation,
      condition: newCondition,
      seller: "Bạn",
      description: newDescription,
      ...(newType === "auction" ? { currentBid: parseFloat(newPrice), bidsCount: 0, endTime: Date.now() + parseFloat(newDuration) * 3600000 } : {})
    };

    persist([item, ...listings]);
    setShowSell(false);
    setNewTitle("");
    setNewPrice("");
    setNewDescription("");
    showToast("Đăng tin thành công!");
  }

  // Vá lỗi 2: Bổ sung bộ lọc an toàn chống Crash khi giá trị truyền vào trống hoặc không hợp lệ
  function fmtPrice(v) {
    if (v === undefined || v === null || isNaN(v)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
  }

  // Định dạng đếm ngược thời gian đấu giá
  function renderCountdown(endTime) {
    const diff = endTime - nowMs;
    if (diff <= 0) return <span className="text-red-500 font-bold">Đã kết thúc</span>;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return (
      <span className="text-amber-600 font-mono font-medium">
        {hrs > 0 ? `${hrs}h ` : ""}{mins}m {secs}s
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans pb-12">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCategory("all"); setType("all"); setSelected(null); }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Bike className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SPOKE
            </span>
          </div>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm xe đạp, phụ tùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <button
            onClick={() => setShowSell(true)}
            className="h-10 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-md active:scale-95 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Đăng tin
          </button>
        </div>
      </header>

      {/* Giao diện chính */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative mb-6 sm:hidden">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto no-scrollbar flex gap-3 pb-2">
          {CATEGORIES.map((x) => {
            const Icon = x.icon;
            const active = category === x.key;
            return (
              <button
                key={x.key}
                onClick={() => { setCategory(x.key); setSelected(null); }}
                className={`flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium whitespace-nowrap border transition ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${active ? "bg-white/20 text-white" : `bg-gradient-to-tr ${x.grad} text-white`}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {x.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200">
          <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setType("all")}
              className={`px-4 h-8 rounded-lg text-xs font-semibold transition ${type === "all" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
            >
              Tất cả loại tin
            </button>
            <button
              onClick={() => setType("auction")}
              className={`px-4 h-8 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${type === "auction" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Gavel className="w-3 h-3 text-amber-500" /> Đấu giá
            </button>
            <button
              onClick={() => setType("buy_now")}
              className={`px-4 h-8 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${type === "buy_now" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Tag className="w-3 h-3 text-emerald-500" /> Mua ngay
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sắp xếp:</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 h-9 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Đang tải sản phẩm dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Không tìm thấy kết quả</h3>
            <p className="text-sm text-slate-500">Hãy thử thay đổi từ khóa hoặc bộ lọc danh mục xem sao nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {filtered.map((item) => {
              const isAuction = item.type === "auction";
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col group"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {isAuction ? (
                        <span className="px-2.5 h-6 rounded-lg bg-amber-500 text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
                          <Gavel className="w-3 h-3" /> ĐẤU GIÁ
                        </span>
                      ) : (
                        <span className="px-2.5 h-6 rounded-lg bg-emerald-500 text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
                          <Tag className="w-3 h-3" /> MUA NGAY
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {item.location}</span>
                        <span>•</span>
                        <span>{item.condition}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          {isAuction ? "Giá đấu hiện tại" : "Giá bán đứt"}
                        </p>
                        <p className={`font-extrabold text-lg ${isAuction ? "text-amber-600" : "text-slate-900"}`}>
                          {fmtPrice(isAuction ? item.currentBid : item.price)}
                        </p>
                      </div>
                      {isAuction && (
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 justify-end">
                            <Clock className="w-3 h-3" /> Còn lại
                          </p>
                          <div className="text-xs">{renderCountdown(item.endTime)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelected(null)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center absolute top-4 right-4 z-10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[16/9] w-full bg-slate-100">
              <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                  Danh mục: {selected.category}
                </span>
                <span className="px-2.5 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
                  Tình trạng: {selected.condition}
                </span>
                <span className="px-2.5 h-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {selected.location}
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 mb-2">{selected.title}</h2>
              <p className="text-xs text-slate-400 mb-4">Người đăng tin: <span className="font-semibold text-slate-600">{selected.seller}</span></p>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-sm text-slate-600 leading-relaxed mb-6">
                <p className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Mô tả chi tiết</p>
                {selected.description}
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {selected.type === "auction" ? "Mức giá hiện tại" : "Giá niêm yết"}
                  </span>
                  <p className="text-2xl font-black text-slate-900">
                    {fmtPrice(selected.type === "auction" ? selected.currentBid : selected.price)}
                  </p>
                  {selected.type === "auction" && (
                    <p className="text-xs text-slate-500 mt-0.5">Số lượt đã đấu giá: <span className="font-bold text-slate-700">{selected.bidsCount || 0} lượt</span></p>
                  )}
                </div>

                {selected.type === "auction" ? (
                  <form onSubmit={handleBid} className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      placeholder="Nhập giá đấu..."
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full sm:w-36 h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                    <button type="submit" className="h-11 px-5 bg-amber-500 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-600 active:scale-95 transition whitespace-nowrap">
                      Đấu giá
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => { setCheckoutItem(selected); setShowCheckout(true); }}
                    className="w-full sm:w-auto h-11 px-8 bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md hover:bg-emerald-600 active:scale-95 transition"
                  >
                    Mua Ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG TIN MỚI */}
      {showSell && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setShowSell(false)} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center absolute top-4 right-4 transition">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-slate-900 mb-6">Tạo Tin Đăng Mới</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tiêu đề sản phẩm</label>
                <input type="text" required placeholder="Ví dụ: Xe đạp touring Giant Escape..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Danh mục</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="road">Xe Road</option>
                    <option value="mtb">Xe MTB</option>
                    <option value="gravel">Xe Gravel</option>
                    <option value="parts">Phụ tùng</option>
                    <option value="accessories">Phụ kiện</option>
                    <option value="apparel">Trang phục</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hình thức bán</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="buy_now">Mua ngay (Giá cố định)</option>
                    <option value="auction">Đấu giá sàn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {newType === "auction" ? "Giá khởi điểm (VNĐ)" : "Giá bán đứt (VNĐ)"}
                  </label>
                  <input type="number" required placeholder="Nhập giá..." value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {newType === "auction" ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Thời hạn sàn (Giờ)</label>
                    <select value={newDuration} onChange={(e) => setNewDuration(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="1">1 giờ</option>
                      <option value="4">4 giờ</option>
                      <option value="12">12 giờ</option>
                      <option value="24">24 giờ (1 ngày)</option>
                      <option value="72">72 giờ (3 ngày)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tình trạng đồ</label>
                    <input type="text" placeholder="Ví dụ: 95%, Mới tinh..." value={newCondition} onChange={(e) => setNewCondition(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Khu vực giao dịch</label>
                <input type="text" placeholder="Ví dụ: Đà Nẵng, Hà Nội..." value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mô tả sản phẩm</label>
                <textarea rows="3" placeholder="Ghi chú chi tiết cấu hình, hãng sản xuất, phụ kiện đi kèm..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md active:scale-95 transition mt-4">
                Đăng tin công khai
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MUA HÀNG THÀNH CÔNG */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🎉</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Chốt Đơn Thành Công!</h3>
            <p className="text-sm text-slate-500 mb-4">
              Bạn đã mua thành công mặt hàng <span className="font-bold text-slate-800">{checkoutItem?.title}</span> với giá <span className="font-bold text-emerald-600">{fmtPrice(checkoutItem?.price)}</span>.
            </p>
            <button
              onClick={() => { setShowCheckout(false); setSelected(null); }}
              className="w-full h-11 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 transition"
            >
              Đóng và tiếp tục xem
            </button>
          </div>
        </div>
      )}

      {/* THÔNG BÁO TOAST POPUP */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900/95 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
