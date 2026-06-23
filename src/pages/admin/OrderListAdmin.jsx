// Lokasi: src/pages/admin/OrderListAdmin.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    HiSearch,
    HiOutlineClipboardList,
    HiOutlineEye,
    HiOutlineTruck,
    HiCheckCircle,
    HiXCircle,
    HiClock,
    HiOutlineCreditCard
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

export default function OrderListAdmin() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const API_URL = `${API_BASE_URL}/admin/orders`;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawData = response.data.data ? response.data.data : response.data;
            const sortedOrders = rawData.sort((a, b) => b.id - a.id);

            setOrders(sortedOrders);
        } catch (error) {
            console.error("Gagal ambil pesanan", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const updatedOrders = orders.map(order =>
            order.id === id ? { ...order, status: newStatus } : order
        );
        setOrders(updatedOrders);

        // Filter Logic
        try {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            await axios.put(`${API_URL}/${id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Gagal update status:", error);
            alert("Gagal update status. Pastikan sesi login aktif.");
            fetchOrders();
        }
    };

    const filteredOrders = orders.filter(order => {
        const term = searchTerm.toLowerCase();
        const inv = order.invoice_number || order.invoice || `INV-${order.id}`;

        let cust = 'Guest';
        if (order.customer_name) cust = order.customer_name;
        else if (order.user?.name) cust = order.user.name;
        else if (order.customer) cust = order.customer;
        else if (order.shipping_address) {
            cust = order.shipping_address.split('|')[0].trim();
        }

        const matchSearch = inv.toLowerCase().includes(term) ||
            cust.toLowerCase().includes(term);

        const matchStatus = filterStatus === 'All' || order.status === filterStatus;

        return matchSearch && matchStatus;
    });

    const getStatusConfig = (status) => {
        switch (String(status).toLowerCase()) {
            case 'pending': return { label: 'Menunggu Pembayaran', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <HiClock /> };
            case 'processing': return { label: 'Diproses', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <HiOutlineClipboardList /> };
            case 'shipped': return { label: 'Dikirim', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <HiOutlineTruck /> };
            case 'completed': return { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <HiCheckCircle /> };
            case 'cancelled': return { label: 'Dibatalkan', color: 'bg-red-50 text-red-700 border-red-200', icon: <HiXCircle /> };
            default: return { label: status || 'Pending', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: null };
        }
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <HiOutlineClipboardList className="text-blue-600" /> Daftar Pesanan
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau dan kelola semua transaksi masuk Khairul Audio</p>
                </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
                {[
                    { key: 'All', label: 'Semua' },
                    { key: 'pending', label: 'Menunggu Pembayaran' },
                    { key: 'processing', label: 'Diproses' },
                    { key: 'shipped', label: 'Dikirim' },
                    { key: 'completed', label: 'Selesai' },
                    { key: 'cancelled', label: 'Dibatalkan' }
                ].map((status) => (
                    <button
                        key={status.key}
                        onClick={() => setFilterStatus(status.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all border
                    ${filterStatus === status.key
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'}
                `}
                    >
                        {status.label}
                    </button>
                ))}
            </div>

            {/* SEARCH BAR */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                <div className="relative flex-1 w-full">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari No. Invoice atau Nama Pelanggan..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="hidden sm:block text-sm text-gray-500 font-medium">
                    Total: {filteredOrders.length} Pesanan
                </div>
            </div>

            {/* TABEL PESANAN */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4 animate-pulse">
                        {[1, 2, 3].map((i) => <div key={i} className="flex gap-4 mb-4"><div className="w-full h-12 bg-gray-100 rounded-lg"></div></div>)}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Invoice & Pelanggan</th>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Total Pesanan</th>
                                    <th className="px-6 py-4">Pengiriman</th>
                                    <th className="px-6 py-4">Metode Pembayaran</th>
                                    <th className="px-6 py-4 text-center">Status Pesanan</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => {
                                        const statusConfig = getStatusConfig(order.status);

                                        const courierCode = order.shipping_courier || order.courier || '';
                                        const courierService = order.shipping_service || order.service || '';
                                        const fullShippingStr = `${courierCode} ${courierService}`.trim().toUpperCase() || '-';

                                        let customerName = 'Guest';
                                        if (order.customer_name) customerName = order.customer_name;
                                        else if (order.user?.name) customerName = order.user.name;
                                        else if (order.customer) customerName = order.customer;
                                        else if (order.shipping_address) {
                                            customerName = order.shipping_address.split('|')[0].trim();
                                        }

                                        const price = Number(order.total_price || order.total || 0);

                                        let formattedDate = '-';
                                        const rawDate = order.created_at || order.order_date || order.date;
                                        if (rawDate) {
                                            const safeDateStr = String(rawDate).replace(/-/g, '/');
                                            const d = new Date(safeDateStr);
                                            if (!isNaN(d.getTime())) {
                                                formattedDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                            } else {
                                                formattedDate = String(rawDate);
                                            }
                                        }

                                        const paymentMethodName = order.payment_method || order.payment_type || order.payment || order.payment_name || "Transfer Bank";

                                        // Semua pembatasan didisable untuk keperluan testing mode sandbox
                                        const isDropdownDisabled = false; 

                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <Link
                                                            to={`/admin/orders/${order.id}`}
                                                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-base"
                                                        >
                                                            {order.invoice_number || order.invoice || `INV-${order.id}`}
                                                        </Link>
                                                        <span className="text-gray-900 font-medium mt-1">{customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                    {formattedDate}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-bold text-gray-900 text-[15px]">
                                                        Rp {new Intl.NumberFormat('id-ID').format(price)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700 flex items-center gap-1 font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200 w-fit whitespace-nowrap">
                                                        <HiOutlineTruck className="w-4 h-4 text-amber-600" /> {fullShippingStr}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700 flex items-center gap-1 font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 w-fit whitespace-nowrap">
                                                        <HiOutlineCreditCard className="w-4 h-4 text-blue-600" /> {paymentMethodName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <div className="relative inline-block">
                                                        <select
                                                            value={order.status || 'pending'}
                                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                            disabled={isDropdownDisabled}
                                                            className={`appearance-none pl-9 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none focus:ring-2 focus:ring-offset-1 transition-all ${statusConfig.color} cursor-pointer hover:brightness-95`}
                                                            title="Ubah status pesanan"
                                                        >
                                                            <option value="pending">Menunggu Pembayaran</option>
                                                            <option value="processing">Diproses</option>
                                                            <option value="shipped">Dikirim</option>
                                                            <option value="completed">Selesai</option>
                                                            <option value="cancelled">Dibatalkan</option>
                                                        </select>
                                                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-80`}>
                                                            {statusConfig.icon}
                                                        </div>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition inline-flex"
                                                        title="Lihat Detail"
                                                    >
                                                        <HiOutlineEye className="w-5 h-5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-10 text-center text-gray-500">
                                            <p>Tidak ada pesanan ditemukan.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
