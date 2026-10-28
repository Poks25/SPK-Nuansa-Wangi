-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: spk_parfum
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `criteria`
--

DROP TABLE IF EXISTS `criteria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `criteria` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `criterion_type` enum('BENEFIT','COST') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_criteria_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `criteria`
--

LOCK TABLES `criteria` WRITE;
/*!40000 ALTER TABLE `criteria` DISABLE KEYS */;
INSERT INTO `criteria` VALUES (1,'C1','Jumlah unit produk terjual','Total unit parfum terjual pada periode analisis','BENEFIT',1,1,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(2,'C2','Frekuensi transaksi produk','Banyaknya transaksi yang menyertakan produk ini','BENEFIT',1,2,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(3,'C3','Omzet penjualan produk','Total nilai penjualan (Rp) dari produk','BENEFIT',1,3,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(4,'C4','Jumlah pelanggan unik','Banyaknya pembeli berbeda yang membeli produk ini','BENEFIT',1,4,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(5,'C5','Tingkat pembelian ulang','Pelanggan yang membeli produk ini lebih dari 1 kali','BENEFIT',1,5,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(6,'C6','Konsistensi penjualan antarperiode','Stabilitas pergerakan penjualan produk antar periode','BENEFIT',1,6,'2026-10-18 10:20:45','2026-10-18 10:20:45');
/*!40000 ALTER TABLE `criteria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `criterion_weights`
--

DROP TABLE IF EXISTS `criterion_weights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `criterion_weights` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `criterion_id` bigint(20) unsigned NOT NULL,
  `weight` decimal(10,8) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_weight_criterion` (`criterion_id`),
  CONSTRAINT `fk_weight_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `criteria` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_weight_positive` CHECK (`weight` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `criterion_weights`
--

LOCK TABLES `criterion_weights` WRITE;
/*!40000 ALTER TABLE `criterion_weights` DISABLE KEYS */;
INSERT INTO `criterion_weights` VALUES (1,1,0.30000000,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(2,2,0.20000000,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(3,3,0.15000000,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(4,4,0.10000000,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(5,5,0.15000000,'2026-10-18 10:20:45','2026-10-18 10:20:45'),(6,6,0.10000000,'2026-10-18 10:20:45','2026-10-18 10:20:45');
/*!40000 ALTER TABLE `criterion_weights` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `name` varchar(160) NOT NULL,
  `category` varchar(100) NOT NULL,
  `unit` varchar(40) NOT NULL,
  `current_stock` decimal(12,3) NOT NULL DEFAULT 0.000,
  `minimum_stock` decimal(12,3) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_items_code` (`code`),
  CONSTRAINT `chk_items_stock` CHECK (`current_stock` >= 0 and (`minimum_stock` is null or `minimum_stock` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,'NW-001','Vanilla Sublime Eau de Parfum','Gourmand Vanilla','botol',45.000,NULL,1,'Aroma manis vanila lembut Madagascar dengan hint amber hangat','2026-10-18 10:20:45','2026-10-18 10:20:45'),(2,'NW-002','Rouge Seduction Parfum','Oriental Floral','botol',30.000,NULL,1,'Inspirasi aroma amberwood, saffron, dan melati elegan mewah','2026-10-18 10:20:45','2026-10-18 10:20:45'),(3,'NW-003','English Pear & Sweet Freesia','Fruity Floral','botol',50.000,NULL,1,'Aroma segar pir matang dan bunga freesia putih lembut segar','2026-10-18 10:20:45','2026-10-18 10:20:45'),(4,'NW-004','Black Opium Night','Warm Spicy Coffee','botol',25.000,NULL,1,'Kombinasi kopi hitam pekat, vanilla bourbon, dan white flowers memikat','2026-10-18 10:20:45','2026-10-18 10:20:45'),(5,'NW-005','Sauvage Ocean Breeze','Aromatic Citrus','botol',40.000,NULL,1,'Aroma segar bergamot calabria dan lada sichuan maskulin dinamis','2026-10-18 10:20:45','2026-10-18 10:20:45'),(6,'NW-006','White Musk Pure Elegance','Musk Powdery','botol',35.000,NULL,1,'Aroma bersih, powdery, lembut menenangkan cocok untuk sehari-hari','2026-10-18 10:20:45','2026-10-18 10:20:45'),(7,'NW-007','Omnia Crystal Bloom','Aquatic Floral','botol',28.000,NULL,1,'Aroma bunga teratai segar, pir jepang, dan balsa wood menawan','2026-10-18 10:20:45','2026-10-18 10:20:45'),(8,'NW-008','Tobacco Vanilla Supreme','Warm Woody','botol',20.000,NULL,1,'Aroma tembakau manis kaya rempah, kakao, dan kayu manis premium','2026-10-18 10:20:45','2026-10-18 10:20:45');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `name` varchar(160) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Floral',
  `volume_ml` int(10) unsigned NOT NULL DEFAULT 50,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'NW-001','Vanilla Sublime Eau de Parfum','Gourmand Vanilla',50,125000.00,45,1,'Aroma manis vanila lembut Madagascar dengan hint amber hangat','2026-10-18 10:20:45','2026-10-18 10:20:45'),(2,'NW-002','Rouge Seduction Parfum','Oriental Floral',50,165000.00,30,1,'Inspirasi aroma amberwood, saffron, dan melati elegan mewah','2026-10-18 10:20:45','2026-10-18 10:20:45'),(3,'NW-003','English Pear & Sweet Freesia','Fruity Floral',50,135000.00,50,1,'Aroma segar pir matang dan bunga freesia putih lembut segar','2026-10-18 10:20:45','2026-10-18 10:20:45'),(4,'NW-004','Black Opium Night','Warm Spicy Coffee',50,145000.00,25,1,'Kombinasi kopi hitam pekat, vanilla bourbon, dan white flowers memikat','2026-10-18 10:20:45','2026-10-18 10:20:45'),(5,'NW-005','Sauvage Ocean Breeze','Aromatic Citrus',50,150000.00,40,1,'Aroma segar bergamot calabria dan lada sichuan maskulin dinamis','2026-10-18 10:20:45','2026-10-18 10:20:45'),(6,'NW-006','White Musk Pure Elegance','Musk Powdery',50,120000.00,35,1,'Aroma bersih, powdery, lembut menenangkan cocok untuk sehari-hari','2026-10-18 10:20:45','2026-10-18 10:20:45'),(7,'NW-007','Omnia Crystal Bloom','Aquatic Floral',50,130000.00,28,1,'Aroma bunga teratai segar, pir jepang, dan balsa wood menawan','2026-10-18 10:20:45','2026-10-18 10:20:45'),(8,'NW-008','Tobacco Vanilla Supreme','Warm Woody',50,175000.00,20,1,'Aroma tembakau manis kaya rempah, kakao, dan kayu manis premium','2026-10-18 10:20:45','2026-10-18 10:20:45');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_transaction_items`
--

DROP TABLE IF EXISTS `sales_transaction_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_transaction_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL DEFAULT 1,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_item_transaction` (`transaction_id`),
  KEY `fk_item_product` (`product_id`),
  CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_item_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `sales_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_transaction_items`
--

LOCK TABLES `sales_transaction_items` WRITE;
/*!40000 ALTER TABLE `sales_transaction_items` DISABLE KEYS */;
INSERT INTO `sales_transaction_items` VALUES (1,1,1,2,125000.00,250000.00,'2026-10-18 10:20:45'),(2,1,2,1,165000.00,165000.00,'2026-10-18 10:20:45'),(3,2,5,2,150000.00,300000.00,'2026-10-18 10:20:45'),(4,3,2,2,165000.00,330000.00,'2026-10-18 10:20:45'),(5,3,3,1,135000.00,135000.00,'2026-10-18 10:20:45'),(6,4,4,1,145000.00,145000.00,'2026-10-18 10:20:45'),(7,4,1,1,125000.00,125000.00,'2026-10-18 10:20:45'),(8,5,1,3,125000.00,375000.00,'2026-10-18 10:20:45'),(9,6,3,2,135000.00,270000.00,'2026-10-18 10:20:45'),(10,6,6,1,120000.00,120000.00,'2026-10-18 10:20:45'),(11,7,5,1,150000.00,150000.00,'2026-10-18 10:20:45'),(12,7,2,1,165000.00,165000.00,'2026-10-18 10:20:45'),(13,8,8,1,175000.00,175000.00,'2026-10-18 10:20:45'),(14,8,5,1,150000.00,150000.00,'2026-10-18 10:20:45'),(15,9,2,1,165000.00,165000.00,'2026-10-18 10:20:45'),(16,9,4,1,145000.00,145000.00,'2026-10-18 10:20:45'),(17,10,1,2,125000.00,250000.00,'2026-10-18 10:20:45'),(18,10,3,1,135000.00,135000.00,'2026-10-18 10:20:45'),(19,11,5,2,150000.00,300000.00,'2026-10-18 10:20:45'),(20,11,1,1,125000.00,125000.00,'2026-10-18 10:20:45'),(21,12,2,2,165000.00,330000.00,'2026-10-18 10:20:45'),(22,13,6,2,120000.00,240000.00,'2026-10-18 10:20:45'),(23,13,7,1,130000.00,130000.00,'2026-10-18 10:20:45'),(24,14,4,2,145000.00,290000.00,'2026-10-18 10:20:45'),(25,15,1,1,125000.00,125000.00,'2026-10-18 10:20:45'),(26,15,2,1,165000.00,165000.00,'2026-10-18 10:20:45'),(27,16,8,2,175000.00,350000.00,'2026-10-18 10:20:45'),(28,17,1,2,125000.00,250000.00,'2026-10-18 10:20:45'),(29,18,1,1,125000.00,125000.00,'2026-10-18 10:20:45'),(30,18,5,1,150000.00,150000.00,'2026-10-18 10:20:45');
/*!40000 ALTER TABLE `sales_transaction_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_transactions`
--

DROP TABLE IF EXISTS `sales_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `transaction_date` date NOT NULL,
  `customer_name` varchar(120) NOT NULL DEFAULT 'Pelanggan Umum',
  `customer_phone` varchar(40) DEFAULT NULL,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_transactions`
--

LOCK TABLES `sales_transactions` WRITE;
/*!40000 ALTER TABLE `sales_transactions` DISABLE KEYS */;
INSERT INTO `sales_transactions` VALUES (1,'TRX-202610-001','2026-10-01','Siti Rahma','081234567890',415000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(2,'TRX-202610-002','2026-10-02','Budi Santoso','081298765432',300000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(3,'TRX-202610-003','2026-10-03','Dewi Lestari','085711223344',465000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(4,'TRX-202610-004','2026-10-04','Ahmad Fauzi','081388997766',270000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(5,'TRX-202610-005','2026-10-05','Siti Rahma','081234567890',375000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(6,'TRX-202610-006','2026-10-06','Rina Marlina','081900112233',390000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(7,'TRX-202610-007','2026-10-07','Budi Santoso','081298765432',315000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(8,'TRX-202610-008','2026-10-08','Hendra Wijaya','087855667788',325000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(9,'TRX-202610-009','2026-10-09','Dewi Lestari','085711223344',310000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(10,'TRX-202610-010','2026-10-10','Maya Anggraini','082133445566',385000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(11,'TRX-202610-011','2026-10-11','Rian Pratama','081277889900',425000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(12,'TRX-202610-012','2026-10-12','Siti Rahma','081234567890',330000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(13,'TRX-202610-013','2026-10-13','Indah Permata','085699887766',370000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(14,'TRX-202610-014','2026-10-14','Fajar Nugraha','081344556677',290000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(15,'TRX-202610-015','2026-10-15','Maya Anggraini','082133445566',290000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(16,'TRX-202610-016','2026-10-16','Doni Saputra','087711335577',350000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(17,'TRX-202610-017','2026-10-17','Dewi Lestari','085711223344',250000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45'),(18,'TRX-202610-018','2026-10-18','Budi Santoso','081298765432',275000.00,'Transaksi Toko Nuansa Wangi','2026-10-18 10:20:45','2026-10-18 10:20:45');
/*!40000 ALTER TABLE `sales_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saw_evaluations`
--

DROP TABLE IF EXISTS `saw_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `saw_evaluations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `total_products` int(10) unsigned NOT NULL DEFAULT 0,
  `status` enum('DRAFT','FINAL') NOT NULL DEFAULT 'FINAL',
  `created_by` varchar(60) NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saw_evaluations`
--

LOCK TABLES `saw_evaluations` WRITE;
/*!40000 ALTER TABLE `saw_evaluations` DISABLE KEYS */;
INSERT INTO `saw_evaluations` VALUES (1,'Uji Integrasi Best Seller','2000-01-01','2026-10-18',8,'FINAL','admin','2026-10-18 10:33:10'),(2,'Uji Integrasi Best Seller','2000-01-01','2026-10-18',8,'FINAL','admin','2026-10-18 10:35:00'),(3,'Perhitungan SAW 2026-10','2026-10-01','2026-10-18',8,'FINAL','admin','2026-10-18 12:29:05');
/*!40000 ALTER TABLE `saw_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saw_results`
--

DROP TABLE IF EXISTS `saw_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `saw_results` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `evaluation_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `rank_position` int(10) unsigned NOT NULL,
  `raw_c1` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `raw_c2` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `raw_c3` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `raw_c4` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `raw_c5` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `raw_c6` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `norm_c1` decimal(10,6) NOT NULL DEFAULT 0.000000,
  `norm_c2` decimal(10,6) NOT NULL DEFAULT 0.000000,
  `norm_c3` decimal(10,6) NOT NULL DEFAULT 0.000000,
  `norm_c4` decimal(10,6) NOT NULL DEFAULT 0.000000,
  `norm_c5` decimal(10,6) NOT NULL DEFAULT 0.000000,
  `norm_c6` decimal(10,6) NOT NULL DEFAULT 0.000000,
  `final_score` decimal(10,6) NOT NULL DEFAULT 0.000000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_saw_evaluation` (`evaluation_id`),
  KEY `fk_saw_product` (`product_id`),
  CONSTRAINT `fk_saw_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `saw_evaluations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_saw_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saw_results`
--

LOCK TABLES `saw_results` WRITE;
/*!40000 ALTER TABLE `saw_results` DISABLE KEYS */;
INSERT INTO `saw_results` VALUES (1,1,1,1,13.0000,8.0000,1625000.0000,6.0000,2.0000,0.4444,1.000000,1.000000,1.000000,1.000000,1.000000,1.000000,1.000000,'2026-10-18 10:33:10'),(2,1,2,2,8.0000,6.0000,1320000.0000,4.0000,2.0000,0.3333,0.615385,0.750000,0.812308,0.666667,1.000000,0.750000,0.748128,'2026-10-18 10:33:10'),(3,1,5,3,7.0000,5.0000,1050000.0000,3.0000,2.0000,0.2778,0.538462,0.625000,0.646154,0.500000,1.000000,0.625113,0.645973,'2026-10-18 10:33:10'),(4,1,4,4,4.0000,3.0000,580000.0000,3.0000,0.0000,0.1667,0.307692,0.375000,0.356923,0.500000,0.000000,0.375113,0.308357,'2026-10-18 10:33:10'),(5,1,3,5,4.0000,3.0000,540000.0000,3.0000,0.0000,0.1667,0.307692,0.375000,0.332308,0.500000,0.000000,0.375113,0.304665,'2026-10-18 10:33:10'),(6,1,8,6,3.0000,2.0000,525000.0000,2.0000,0.0000,0.1111,0.230769,0.250000,0.323077,0.333333,0.000000,0.250000,0.226026,'2026-10-18 10:33:10'),(7,1,6,7,3.0000,2.0000,360000.0000,2.0000,0.0000,0.1111,0.230769,0.250000,0.221538,0.333333,0.000000,0.250000,0.210795,'2026-10-18 10:33:10'),(8,1,7,8,1.0000,1.0000,130000.0000,1.0000,0.0000,0.0556,0.076923,0.125000,0.080000,0.166667,0.000000,0.125113,0.089255,'2026-10-18 10:33:10'),(9,2,1,1,13.0000,8.0000,1625000.0000,6.0000,2.0000,0.4444,1.000000,1.000000,1.000000,1.000000,1.000000,1.000000,1.000000,'2026-10-18 10:35:00'),(10,2,2,2,8.0000,6.0000,1320000.0000,4.0000,2.0000,0.3333,0.615385,0.750000,0.812308,0.666667,1.000000,0.750000,0.748128,'2026-10-18 10:35:00'),(11,2,5,3,7.0000,5.0000,1050000.0000,3.0000,2.0000,0.2778,0.538462,0.625000,0.646154,0.500000,1.000000,0.625113,0.645973,'2026-10-18 10:35:00'),(12,2,4,4,4.0000,3.0000,580000.0000,3.0000,0.0000,0.1667,0.307692,0.375000,0.356923,0.500000,0.000000,0.375113,0.308357,'2026-10-18 10:35:00'),(13,2,3,5,4.0000,3.0000,540000.0000,3.0000,0.0000,0.1667,0.307692,0.375000,0.332308,0.500000,0.000000,0.375113,0.304665,'2026-10-18 10:35:00'),(14,2,8,6,3.0000,2.0000,525000.0000,2.0000,0.0000,0.1111,0.230769,0.250000,0.323077,0.333333,0.000000,0.250000,0.226026,'2026-10-18 10:35:00'),(15,2,6,7,3.0000,2.0000,360000.0000,2.0000,0.0000,0.1111,0.230769,0.250000,0.221538,0.333333,0.000000,0.250000,0.210795,'2026-10-18 10:35:00'),(16,2,7,8,1.0000,1.0000,130000.0000,1.0000,0.0000,0.0556,0.076923,0.125000,0.080000,0.166667,0.000000,0.125113,0.089255,'2026-10-18 10:35:00'),(17,3,1,1,13.0000,8.0000,1625000.0000,6.0000,2.0000,1.0000,1.000000,1.000000,1.000000,1.000000,1.000000,1.000000,1.000000,'2026-10-18 12:29:05'),(18,3,2,2,8.0000,6.0000,1320000.0000,4.0000,2.0000,1.0000,0.615385,0.750000,0.812308,0.666667,1.000000,1.000000,0.773128,'2026-10-18 12:29:05'),(19,3,5,3,7.0000,5.0000,1050000.0000,3.0000,1.0000,1.0000,0.538462,0.625000,0.646154,0.500000,0.500000,1.000000,0.608462,'2026-10-18 12:29:05'),(20,3,4,4,4.0000,3.0000,580000.0000,3.0000,0.0000,1.0000,0.307692,0.375000,0.356923,0.500000,0.000000,1.000000,0.370846,'2026-10-18 12:29:05'),(21,3,3,5,4.0000,3.0000,540000.0000,3.0000,0.0000,1.0000,0.307692,0.375000,0.332308,0.500000,0.000000,1.000000,0.367154,'2026-10-18 12:29:05'),(22,3,8,6,3.0000,2.0000,525000.0000,2.0000,0.0000,1.0000,0.230769,0.250000,0.323077,0.333333,0.000000,1.000000,0.301026,'2026-10-18 12:29:05'),(23,3,6,7,3.0000,2.0000,360000.0000,2.0000,0.0000,1.0000,0.230769,0.250000,0.221538,0.333333,0.000000,1.000000,0.285795,'2026-10-18 12:29:05'),(24,3,7,8,1.0000,1.0000,130000.0000,1.0000,0.0000,1.0000,0.076923,0.125000,0.080000,0.166667,0.000000,1.000000,0.176744,'2026-10-18 12:29:05');
/*!40000 ALTER TABLE `saw_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcriteria`
--

DROP TABLE IF EXISTS `subcriteria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subcriteria` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `criterion_id` bigint(20) unsigned NOT NULL,
  `label` varchar(120) NOT NULL,
  `score` decimal(12,4) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subcriteria_criterion_label` (`criterion_id`,`label`),
  CONSTRAINT `fk_subcriteria_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `criteria` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_subcriteria_score` CHECK (`score` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcriteria`
--

LOCK TABLES `subcriteria` WRITE;
/*!40000 ALTER TABLE `subcriteria` DISABLE KEYS */;
/*!40000 ALTER TABLE `subcriteria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(60) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(120) NOT NULL,
  `role` enum('ADMIN','LEADER') NOT NULL DEFAULT 'ADMIN',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','scrypt$32768$8$1$hDa77AINAqg1F5tSlr_97A$OlLyDzZf8diz-Nn0-AGn4P4qwzsqDQID34ZXhC5xDPEvrkgSnzG-bvzrtMQTRulxUQRJaxme4VTWQF9v4GnW4w','Administrator Nuansa Wangi','ADMIN',1,'2026-10-18 10:20:45','2026-10-18 13:04:25'),(2,'pimpinan','scrypt$32768$8$1$KQXHxCOfjl39IJslwPFvRw$9lKfZyCykSBqaQoRwZ4sTfk9KXqXKi9nMP1vffkOcps9uOqetbJQH11QvYnzTo_hBkPPjA4wOBHFbz1F36PgQQ','Pimpinan Toko Nuansa Wangi','LEADER',1,'2026-10-18 10:20:45','2026-10-18 13:05:35');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'spk_parfum'
--

--
-- Dumping routines for database 'spk_parfum'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-18 20:30:06
