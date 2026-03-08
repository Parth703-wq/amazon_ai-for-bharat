import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, Phone, Clock, Navigation, Signal, Search,
    Building, Monitor, Landmark, Building2, Loader2, LocateFixed, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Fix Leaflet default icon paths (vite issue)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// Custom colored markers
const makeIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const GREEN_ICON = makeIcon('green');
const RED_ICON = makeIcon('red');
const BLUE_ICON = makeIcon('blue');

const OFFICE_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'jan_seva_kendra', label: 'Jan Seva Kendra' },
    { value: 'csc_centre', label: 'CSC Centre' },
    { value: 'gram_panchayat', label: 'Gram Panchayat' },
    { value: 'district_office', label: 'District Office' },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
    jan_seva_kendra: <Building className="h-4 w-4" />,
    csc_centre: <Monitor className="h-4 w-4" />,
    gram_panchayat: <Landmark className="h-4 w-4" />,
    district_office: <Building2 className="h-4 w-4" />,
};

interface Office {
    id: number;
    name: string;
    office_type: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    phone: string;
    open_time: string;
    close_time: string;
    working_days: string;
    services: string[];
    is_open: boolean;
    distance_km: number | null;
}

// Component to fly to user location
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => { map.flyTo([lat, lng], 12, { duration: 1.5 }); }, [lat, lng]);
    return null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const OfficeLocator = () => {
    const [offices, setOffices] = useState<Office[]>([]);
    const [selected, setSelected] = useState<Office | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [is2G, setIs2G] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([22.9, 79.8]); // India center
    const [mapZoom, setMapZoom] = useState(5);
    const mapRef = useRef<any>(null);

    useEffect(() => { fetchOffices(); }, [typeFilter]);

    const fetchOffices = async (lat?: number, lng?: number) => {
        setLoading(true);
        try {
            let url = `${API_BASE}/offices/all?`;
            if (typeFilter) url += `office_type=${typeFilter}&`;
            if (search) url += `search=${encodeURIComponent(search)}&`;
            if (lat && lng) url += `lat=${lat}&lng=${lng}`;
            const res = await fetch(url);
            const data = await res.json();
            setOffices(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const locateMe = () => {
        if (!navigator.geolocation) return alert('Geolocation not supported');
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setUserLocation({ lat, lng });
                setMapCenter([lat, lng]);
                setMapZoom(12);
                fetchOffices(lat, lng);
                setLocating(false);
            },
            () => { alert('Location access denied'); setLocating(false); }
        );
    };

    const getDirections = (office: Office) => {
        const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
        const dest = `${office.latitude},${office.longitude}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
        window.open(url, '_blank');
    };

    const filtered = offices.filter(o => {
        if (!search) return true;
        const q = search.toLowerCase();
        return o.name.toLowerCase().includes(q) || o.city?.toLowerCase().includes(q) ||
            o.pincode?.includes(q) || o.state?.toLowerCase().includes(q);
    });

    return (
        <section className="bg-gray-50 py-12 border-t border-gray-200" id="office-locator">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Find Assistance Centers</h2>
                        <p className="mt-1 text-gray-500 text-sm">
                            {filtered.length} centers across India — Jan Seva Kendras, CSCs, Gram Panchayats
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={locateMe} isLoading={locating} variant="outline" size="sm" className="shrink-0">
                            <LocateFixed className="h-4 w-4 mr-2" /> Near Me
                        </Button>
                        <Button
                            variant={is2G ? 'primary' : 'outline'} size="sm"
                            onClick={() => setIs2G(!is2G)} className="shrink-0"
                        >
                            <Signal className="h-4 w-4 mr-2" />
                            {is2G ? '2G Mode ON' : '2G Mode'}
                        </Button>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-wrap gap-3 mb-5">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Search by city, pincode, state..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchOffices()}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {OFFICE_TYPES.map(t => (
                            <button key={t.value}
                                onClick={() => setTypeFilter(t.value)}
                                className={`text-xs px-3 py-2 rounded-xl border transition-all ${typeFilter === t.value ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mb-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block"></span> Open Now</span>
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block"></span> Closed</span>
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block"></span> Your Location</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
                    {/* LEFT — Office List */}
                    <div className="lg:col-span-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-700">
                            {loading ? 'Loading...' : `${filtered.length} centers found`}
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {loading ? (
                                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">No offices found</div>
                            ) : filtered.map(office => (
                                <Card
                                    key={office.id}
                                    onClick={() => { setSelected(office); setMapCenter([office.latitude, office.longitude]); setMapZoom(14); }}
                                    className={`cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm ${selected?.id === office.id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
                                                    {TYPE_ICON[office.office_type] || <Building className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{office.name}</h4>
                                                    <p className="text-xs text-gray-400">{office.city}, {office.state}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${office.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {office.is_open ? 'Open' : 'Closed'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500 mb-2 flex items-start gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
                                            {office.address}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{office.open_time}–{office.close_time}</span>
                                            {office.distance_km && (
                                                <span className="font-semibold text-primary">{office.distance_km} km</span>
                                            )}
                                        </div>

                                        {office.services && office.services.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {(Array.isArray(office.services) ? office.services : JSON.parse(office.services as any)).slice(0, 3).map((s: string, i: number) => (
                                                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                                            <a href={`tel:${office.phone}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                                    <Phone className="h-3 w-3 mr-1" /> Call
                                                </Button>
                                            </a>
                                            <Button size="sm" className="flex-1 text-xs h-8" onClick={(e) => { e.stopPropagation(); getDirections(office); }}>
                                                <Navigation className="h-3 w-3 mr-1" /> Directions
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — Map or 2G List */}
                    <div className="lg:col-span-2 rounded-xl overflow-hidden border border-gray-200 shadow-sm h-full" style={{ touchAction: 'none' }}>
                        {is2G ? (
                            <div className="h-full bg-white p-6 overflow-y-auto">
                                <div className="flex items-center gap-2 mb-4 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                                    <Signal className="h-4 w-4" />
                                    2G Mode: Map hidden to save data. Showing text list only.
                                </div>
                                <div className="space-y-3">
                                    {filtered.map(o => (
                                        <div key={o.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900">{o.name}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{o.address}</p>
                                                <p className="text-xs text-gray-400 mt-1">{o.phone} · {o.open_time}–{o.close_time}</p>
                                            </div>
                                            <div className="flex flex-col gap-1 shrink-0">
                                                {o.distance_km && <span className="text-xs font-bold text-primary">{o.distance_km} km</span>}
                                                <span className={`text-xs px-2 py-0.5 rounded-full text-center ${o.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{o.is_open ? 'Open' : 'Closed'}</span>
                                                <button onClick={() => getDirections(o)} className="text-xs text-primary underline">Directions</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                style={{ height: '100%', width: '100%' }}
                                ref={mapRef}
                                dragging={true}
                                scrollWheelZoom={true}
                                touchZoom={true}
                                doubleClickZoom={true}
                                keyboard={true}
                                zoomControl={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <FlyTo lat={mapCenter[0]} lng={mapCenter[1]} />

                                {/* User location */}
                                {userLocation && (
                                    <Marker position={[userLocation.lat, userLocation.lng]} icon={BLUE_ICON}>
                                        <Popup><strong>Your Location</strong></Popup>
                                    </Marker>
                                )}

                                {/* Office markers */}
                                {filtered.map(office => (
                                    <Marker
                                        key={office.id}
                                        position={[office.latitude, office.longitude]}
                                        icon={office.is_open ? GREEN_ICON : RED_ICON}
                                        eventHandlers={{ click: () => setSelected(office) }}
                                    >
                                        <Popup maxWidth={280}>
                                            <div className="text-sm min-w-[220px]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${office.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {office.is_open ? 'Open Now' : 'Closed'}
                                                    </span>
                                                </div>
                                                <strong className="block text-gray-900 leading-tight mb-1">{office.name}</strong>
                                                <p className="text-gray-500 text-xs mb-1">{office.address}</p>
                                                <p className="text-gray-500 text-xs mb-2">{office.phone} · {office.open_time}–{office.close_time} · {office.working_days}</p>
                                                {office.distance_km && <p className="text-primary font-semibold text-xs mb-2">{office.distance_km} km away</p>}
                                                {office.services && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {(Array.isArray(office.services) ? office.services : JSON.parse(office.services as any)).slice(0, 4).map((s: string, i: number) => (
                                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <a href={`tel:${office.phone}`} className="flex-1 text-center text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                                                        Call
                                                    </a>
                                                    <button onClick={() => getDirections(office)} className="flex-1 text-center text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                                                        Directions
                                                    </button>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
