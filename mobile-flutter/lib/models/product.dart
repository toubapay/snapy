class Product {
  final String id;
  final String name;
  final String category;
  final String imageUrl;
  final String description;
  final String vendorId;
  final String storeName;
  final String ownerLabel;
  final String sellerPhone;
  final String contact;
  final int createdAt;

  Product({
    required this.id,
    required this.name,
    required this.category,
    required this.imageUrl,
    required this.description,
    required this.vendorId,
    required this.storeName,
    required this.ownerLabel,
    required this.sellerPhone,
    required this.contact,
    required this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        name: j['name'] as String,
        category: (j['category'] as String?) ?? 'Autres',
        imageUrl: j['imageUrl'] as String,
        description: (j['description'] as String?) ?? '',
        vendorId: (j['vendorId'] as String?) ?? '',
        storeName: (j['storeName'] as String?) ?? '',
        ownerLabel: (j['ownerLabel'] as String?) ?? '',
        sellerPhone: (j['sellerPhone'] as String?) ?? '',
        contact: (j['contact'] as String?) ?? '',
        createdAt: (j['createdAt'] as num?)?.toInt() ?? 0,
      );
}

class Category {
  final String name;
  final int count;
  Category({required this.name, required this.count});
  factory Category.fromJson(Map<String, dynamic> j) => Category(name: j['name'] as String, count: (j['count'] as num).toInt());
}

class ChatMessage {
  final String id;
  final String senderId;
  final String role;
  final String text;
  final int createdAt;
  ChatMessage({required this.id, required this.senderId, required this.role, required this.text, required this.createdAt});
  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: j['id'] as String,
        senderId: j['senderId'] as String,
        role: j['role'] as String,
        text: j['text'] as String,
        createdAt: (j['createdAt'] as num).toInt(),
      );
}
