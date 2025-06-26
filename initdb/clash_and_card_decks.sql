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
-- Table structure for table `decks`
--

DROP TABLE IF EXISTS `decks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `decks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) DEFAULT NULL,
  `card_type` varchar(50) NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `decks_ibfk_1` (`user_id`),
  CONSTRAINT `decks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `decks`
--

LOCK TABLES `decks` WRITE;
/*!40000 ALTER TABLE `decks` DISABLE KEYS */;
INSERT INTO `decks` VALUES (1,'1','rock',13),(2,'1','paper',12),(3,'1','scissors',35),(4,'2','rock',7),(5,'2','paper',5),(6,'2','scissors',10),(7,'0b3740a3-5d2a-4021-aadf-2b40a9b6bd60','rock',5),(8,'0b3740a3-5d2a-4021-aadf-2b40a9b6bd60','paper',11),(9,'0b3740a3-5d2a-4021-aadf-2b40a9b6bd60','scissors',5),(10,'059558c0-d3b2-40d4-be8e-e057388b8348','rock',10),(11,'059558c0-d3b2-40d4-be8e-e057388b8348','paper',5),(12,'059558c0-d3b2-40d4-be8e-e057388b8348','scissors',5),(13,'97523b0a-9dda-4bbc-b5af-08208ed078cb','rock',5),(14,'97523b0a-9dda-4bbc-b5af-08208ed078cb','paper',5),(15,'97523b0a-9dda-4bbc-b5af-08208ed078cb','scissors',10),(16,'415b0438-e44a-4931-b055-87114d787157','rock',10),(17,'415b0438-e44a-4931-b055-87114d787157','paper',5),(18,'415b0438-e44a-4931-b055-87114d787157','scissors',5),(19,'533bc87e-edb4-47e2-8003-8149bbd68bfb','rock',5),(20,'533bc87e-edb4-47e2-8003-8149bbd68bfb','paper',10),(21,'533bc87e-edb4-47e2-8003-8149bbd68bfb','scissors',5),(22,'ef336d25-af25-4a72-816b-c0166cecb2f1','rock',5),(23,'ef336d25-af25-4a72-816b-c0166cecb2f1','paper',5),(24,'ef336d25-af25-4a72-816b-c0166cecb2f1','scissors',10),(25,'cbf1cfa7-3be9-43a0-a5c1-f677f3d32534','rock',5),(26,'cbf1cfa7-3be9-43a0-a5c1-f677f3d32534','paper',5),(27,'cbf1cfa7-3be9-43a0-a5c1-f677f3d32534','scissors',10),(28,'d9d3453b-3b47-48e6-94ad-1b1361681f58','rock',0),(29,'d9d3453b-3b47-48e6-94ad-1b1361681f58','paper',4),(30,'d9d3453b-3b47-48e6-94ad-1b1361681f58','scissors',0),(31,'237c1f04-50c9-41b3-b47b-12c7487a066d','rock',5),(32,'237c1f04-50c9-41b3-b47b-12c7487a066d','paper',5),(33,'237c1f04-50c9-41b3-b47b-12c7487a066d','scissors',10),(34,'f225a866-b2da-450a-8d1f-53a78437661d','rock',5),(35,'f225a866-b2da-450a-8d1f-53a78437661d','paper',5),(36,'f225a866-b2da-450a-8d1f-53a78437661d','scissors',10),(37,'2ab96695-9f04-4507-8507-d2d2144e6541','rock',5),(38,'2ab96695-9f04-4507-8507-d2d2144e6541','paper',10),(39,'2ab96695-9f04-4507-8507-d2d2144e6541','scissors',5),(40,'9f7d2985-d1f4-4cea-95d4-3e56e718aadf','rock',5),(41,'9f7d2985-d1f4-4cea-95d4-3e56e718aadf','paper',10),(42,'9f7d2985-d1f4-4cea-95d4-3e56e718aadf','scissors',5);
/*!40000 ALTER TABLE `decks` ENABLE KEYS */;
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
