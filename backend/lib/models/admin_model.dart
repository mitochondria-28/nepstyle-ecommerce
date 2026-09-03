class Admin {
  final int? adminId;
  final String fullname;
  final String emailAddress;
  final String password;

  Admin({
    this.adminId,
    required this.fullname,
    required this.emailAddress,
    required this.password,
  });

  Map<String, dynamic> toMap() => {
        'admin_id': adminId,
        'fullname': fullname,
        'email_address': emailAddress,
      };
}
