class User {
  int? userId;
  String fullname;
  String emailAddress;
  String password;
  String contactNumber;
  String? address;
  String? profileImage;
  String? otp;
  bool emailVerified;

  User({
     this.userId,
    required this.fullname,
    required this.emailAddress,
    required this.password,
    required this.contactNumber,
    this.address,
    this.profileImage,
    this.otp,
    this.emailVerified = false,
  });

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      userId: map['user_id'],
      fullname: map['fullname'],
      emailAddress: map['email_address'],
      password: map['password'],
      contactNumber: map['contact_number'],
      address: map['address'],
      profileImage: map['profile_image'],
      otp: map['otp'],
      emailVerified: map['email_verified'] == '1',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'fullname': fullname,
      'email_address': emailAddress,
      'password': password,
      'contact_number': contactNumber,
      'address': address,
      'profile_image': profileImage,
      'otp': otp,
      'email_verified': emailVerified ? '1' : '0',
    };
  }
}
