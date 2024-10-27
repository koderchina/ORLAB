--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2024-10-26 16:44:15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16400)
-- Name: punionica; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.punionica (
    id_punionice integer NOT NULL,
    naziv_punionice character varying(100) NOT NULL,
    adresa character varying(255) NOT NULL,
    geografska_sirina numeric(9,6),
    geografska_duzina numeric(9,6),
    vrsta_punjenja character varying(20),
    broj_punjaca integer,
    snaga_punjenja numeric(5,2),
    cijena_po_kwh numeric(5,2),
    otvorenje time without time zone,
    zatvaranje time without time zone,
    CONSTRAINT punionica_vrsta_punjenja_check CHECK (((vrsta_punjenja)::text = ANY ((ARRAY['brzo'::character varying, 'standardno'::character varying])::text[])))
);


ALTER TABLE public.punionica OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16399)
-- Name: punionica_id_punionice_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.punionica_id_punionice_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.punionica_id_punionice_seq OWNER TO postgres;

--
-- TOC entry 4800 (class 0 OID 0)
-- Dependencies: 215
-- Name: punionica_id_punionice_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.punionica_id_punionice_seq OWNED BY public.punionica.id_punionice;


--
-- TOC entry 218 (class 1259 OID 16408)
-- Name: stanicazapunjenje; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stanicazapunjenje (
    id_stanice integer NOT NULL,
    id_punionice integer,
    tip_konektora character varying(20),
    snaga_stanice numeric(5,2),
    pruzatelj character varying(255),
    CONSTRAINT stanicazapunjenje_tip_konektora_check CHECK (((tip_konektora)::text = ANY ((ARRAY['CCS'::character varying, 'CHAdeMO'::character varying, 'Type 2'::character varying, 'CCS2'::character varying])::text[])))
);


ALTER TABLE public.stanicazapunjenje OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16407)
-- Name: stanicazapunjenje_id_stanice_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stanicazapunjenje_id_stanice_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stanicazapunjenje_id_stanice_seq OWNER TO postgres;

--
-- TOC entry 4801 (class 0 OID 0)
-- Dependencies: 217
-- Name: stanicazapunjenje_id_stanice_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stanicazapunjenje_id_stanice_seq OWNED BY public.stanicazapunjenje.id_stanice;


--
-- TOC entry 4639 (class 2604 OID 16403)
-- Name: punionica id_punionice; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.punionica ALTER COLUMN id_punionice SET DEFAULT nextval('public.punionica_id_punionice_seq'::regclass);


--
-- TOC entry 4640 (class 2604 OID 16411)
-- Name: stanicazapunjenje id_stanice; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stanicazapunjenje ALTER COLUMN id_stanice SET DEFAULT nextval('public.stanicazapunjenje_id_stanice_seq'::regclass);


--
-- TOC entry 4792 (class 0 OID 16400)
-- Dependencies: 216
-- Data for Name: punionica; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.punionica (id_punionice, naziv_punionice, adresa, geografska_sirina, geografska_duzina, vrsta_punjenja, broj_punjaca, snaga_punjenja, cijena_po_kwh, otvorenje, zatvaranje) FROM stdin;
121	Electric Vehicle Charging Station	Ulica Bartula Kašića 6, 10000, Zagreb	45.812231	15.996305	standardno	4	22.00	0.43	\N	\N
122	Petrol Charging Station	Radnička cesta 55, 10000, Zagreb	45.801092	16.008394	brzo	6	50.00	0.55	\N	\N
123	ELEN Charging Station	Trg Stjepana Radića 1, 10000, Zagreb	45.800747	15.977965	brzo	3	50.00	1.06	\N	\N
124	Hrvatski Telekom Charging Station	Jaruščica 23, 10000, Zagreb	45.769131	15.934288	brzo	3	60.00	\N	07:00:00	22:00:00
125	Petrol Charging Station	Miramarska Cesta bb, 10000, Zagreb	45.803244	15.974489	standardno	4	22.00	0.43	\N	\N
126	Lidl Hrvatska Charging Station	Josipa Jurja Strossmayera 350, 31000, Osijek	45.568074	18.637213	standardno	1	11.00	\N	07:00:00	22:00:00
127	Electric Vehicle Charging Station	Istarska ul. 1, 31000, Osijek	45.560382	18.694205	brzo	3	50.00	0.78	\N	\N
128	Elen Charging Station	Drinska ul., 31000, Osijek	45.547026	18.679725	brzo	3	50.00	0.78	\N	\N
129	Porsche Croatia d.o.o. Charging Station	Ul. Svetog Leopolda Bogdana Mandića 22, 31000, Osijek	45.551724	18.667105	brzo	4	50.00	-1.00	\N	\N
130	ELEN Charging Station	31000, Tvrđa, Osijek	45.560902	18.699921	brzo	3	50.00	0.78	\N	\N
\.


--
-- TOC entry 4794 (class 0 OID 16408)
-- Dependencies: 218
-- Data for Name: stanicazapunjenje; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stanicazapunjenje (id_stanice, id_punionice, tip_konektora, snaga_stanice, pruzatelj) FROM stdin;
105	121	Type 2	22.00	https://www.petrol.hr/
106	121	Type 2	21.00	https://www.petrol.hr/
107	121	Type 2	11.00	https://www.petrol.hr/
108	122	CCS	50.00	https://www.petrol.hr/
109	122	CHAdeMO	50.00	https://www.petrol.hr/
110	122	Type 2	22.00	https://www.petrol.hr/
111	122	Type 2	11.00	https://www.petrol.hr/
112	123	CHAdeMO	50.00	https://elen.hep.hr/
113	123	CCS	50.00	https://elen.hep.hr/
114	123	Type 2	43.00	https://elen.hep.hr/
115	124	CCS	60.00	https://www.t.ht.hr/
116	124	Type 2	22.00	https://www.t.ht.hr/
117	125	Type 2	22.00	https://www.petrol.hr/
118	126	Type 2	11.00	https://www.lidl.hr/
119	127	CHAdeMO	50.00	\N
120	127	CCS	50.00	\N
121	127	Type 2	43.00	\N
122	128	CHAdeMO	50.00	https://elen.hep.hr/
123	128	CCS	50.00	https://elen.hep.hr/
124	128	Type 2	43.00	https://elen.hep.hr/
125	129	CCS2	75.00	https://www.chargepoint.com/
126	129	CHAdeMO	75.00	https://www.chargepoint.com/
127	129	Type 2	22.00	https://www.chargepoint.com/
128	130	CHAdeMO	50.00	https://elen.hep.hr/
129	130	CCS	50.00	https://elen.hep.hr/
130	130	Type 2	22.00	https://elen.hep.hr/
\.


--
-- TOC entry 4802 (class 0 OID 0)
-- Dependencies: 215
-- Name: punionica_id_punionice_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.punionica_id_punionice_seq', 130, true);


--
-- TOC entry 4803 (class 0 OID 0)
-- Dependencies: 217
-- Name: stanicazapunjenje_id_stanice_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stanicazapunjenje_id_stanice_seq', 130, true);


--
-- TOC entry 4644 (class 2606 OID 16406)
-- Name: punionica punionica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.punionica
    ADD CONSTRAINT punionica_pkey PRIMARY KEY (id_punionice);


--
-- TOC entry 4646 (class 2606 OID 16414)
-- Name: stanicazapunjenje stanicazapunjenje_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stanicazapunjenje
    ADD CONSTRAINT stanicazapunjenje_pkey PRIMARY KEY (id_stanice);


--
-- TOC entry 4647 (class 2606 OID 16415)
-- Name: stanicazapunjenje stanicazapunjenje_id_punionice_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stanicazapunjenje
    ADD CONSTRAINT stanicazapunjenje_id_punionice_fkey FOREIGN KEY (id_punionice) REFERENCES public.punionica(id_punionice) ON DELETE CASCADE;


-- Completed on 2024-10-26 16:44:15

--
-- PostgreSQL database dump complete
--

