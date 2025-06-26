-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: clash_and_card
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `atk` int DEFAULT '0',
  `def` int DEFAULT '0',
  `hp` int DEFAULT '100',
  `spd` int DEFAULT '0',
  `level` int DEFAULT '1',
  `current_campaign_level` int DEFAULT NULL,
  `exp` int DEFAULT '0',
  `gold` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `class` varchar(20) DEFAULT 'none',
  `stat_point` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('059558c0-d3b2-40d4-be8e-e057388b8348','Player','warrior@example.com','$2a$10$CHno2zNKmuUSLVScGEOTbe1fePSeve/mkWGiWPVxLWAEQP8WJe2yG',20,10,100,10,1,1,0,0,'2025-06-13 14:36:38','warrior',0),('0b3740a3-5d2a-4021-aadf-2b40a9b6bd60','Player','mage@example.com','$2a$10$e.BLZG6MxMbTb2fwTrMjPOvbjgcyJdk7nMc1nbr4sYBNZg9vqEh9y',32,14,220,18,5,8,265,115,'2025-06-13 14:29:24','mage',0),('1','test_player','test@example.com','$2a$10$1XIPf8dqS/E3eb0pNE311uZcfBcPf5uMTjDU0PGkuWRwoFZmSOmSG',121,32,420,17,11,15,375,81030,'2025-05-19 21:42:51','assassin',0),('1a618229-a6c6-4847-bf59-c386ac159aba','Player','pun@example.com','$2a$10$483CdfyWtavUHNNzjZvRwOhMtqCX6ghTyCp0Fy0rBOJ1Bg4.KgAqG',20,10,100,10,1,1,0,0,'2025-06-12 12:10:43','none',0),('2','user2','user2@example.com','$2a$10$1XIPf8dqS/E3eb0pNE311uZcfBcPf5uMTjDU0PGkuWRwoFZmSOmSG',20,14,130,102,3,5,150,200,'2025-05-27 17:57:51','assassin',0),('237c1f04-50c9-41b3-b47b-12c7487a066d','Player','punnawat_punpun9559@hotmail.com','$2a$10$z5WKuLH5Brcrz.GdU1K5p.eXSSxBMEbsyTt5u2jaonA8KsnAs95Ge',20,10,50,10,1,1,0,0,'2025-06-23 08:13:07','assassin',0),('2ab96695-9f04-4507-8507-d2d2144e6541','afsfasfaf','afsfasfaf@ddd.com','$2a$10$.DrtBUFfvuABejYJj.5ex.HQjEGvRBPZ8EudHjtPJHE7SnANDN776',20,10,50,10,1,1,0,0,'2025-06-23 09:03:59','mage',0),('415b0438-e44a-4931-b055-87114d787157','Player','123@example.com','$2a$10$O/yJ0w7LcW3mRBKnFkJBjOsbya6UCCUcQB400SoTX8ykf9aJdZhFi',20,10,100,10,1,1,0,0,'2025-06-13 14:42:07','warrior',0),('533bc87e-edb4-47e2-8003-8149bbd68bfb','Player','uwu@example.com','$2a$10$hgfuMv4/h8rGCreaQPk.reukFbOd/RByOLBmRyhq4ZklHcsCwdLPK',20,10,100,10,1,1,0,0,'2025-06-13 14:45:15','mage',0),('97523b0a-9dda-4bbc-b5af-08208ed078cb','Player','assassin@example.com','$2a$10$r/myHTfxbO/QbACPj9MrseZ32YBKGvpYNxUcVIkg5RnGAl9I/K.0K',26,13,130,19,4,5,65,315,'2025-06-13 14:40:08','assassin',6),('9f7d2985-d1f4-4cea-95d4-3e56e718aadf','test@test.com','test@test.com','$2a$10$FcPHo3/ky/zMPAfSh9cx6.v1dasYZmqQH.9Dvevxs8kjbUaK5NjzG',20,10,50,10,1,1,0,0,'2025-06-25 07:13:12','mage',0),('cbf1cfa7-3be9-43a0-a5c1-f677f3d32534','Player','inw@example.com','$2a$10$FxHCFEH.TARYRju8TqW35.wOa6xSA3tD2waWZHsDL3LzDuoR6Rghq',20,10,100,10,1,1,0,0,'2025-06-13 16:23:02','assassin',0),('d9d3453b-3b47-48e6-94ad-1b1361681f58','Player','poor@example.com','$2a$10$O8cct..Ml/aeFIYQDDqxFu2CxbCzakp2RZggF9wdsN7/d4QrzJzsO',20,10,50,10,1,1,0,0,'2025-06-14 14:12:32','mage',0),('ef336d25-af25-4a72-816b-c0166cecb2f1','Player','yay@example.com','$2a$10$vmNbi2lfcoLLKkO7N/WlbesTuWJs.3qFe0tFxWwf02OPnwwrhdZSy',20,10,100,10,1,1,0,0,'2025-06-13 14:48:29','assassin',0),('f225a866-b2da-450a-8d1f-53a78437661d','pun','punnawat_punpun9560@hotmail.com','$2a$10$gzqs3TdAJjS9Vh/rtzJ0O.gsA7v/xcxYbWAEFTw/KBjYO0oxGlSYS',20,10,50,10,1,1,0,0,'2025-06-23 09:03:38','assassin',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-26 15:36:40
