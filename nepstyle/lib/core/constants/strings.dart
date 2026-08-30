import 'package:nepstyle/core/constants/user_data.dart';

// Physical Android device needs the Mac's LAN IP (not localhost)
String baseUrl = "http://192.168.1.66:8080";
String loginUrl = "$baseUrl/api/auth/login";
String registerUrl = "$baseUrl/api/auth/register";
String homeUrl = "$baseUrl/api/home/$userId";
String imagePlaceholder = 'assets/images/placeholder.png';
