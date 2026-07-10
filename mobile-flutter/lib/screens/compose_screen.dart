import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../services/api.dart';
import '../services/auth_provider.dart';
import '../theme/colors.dart';

class ComposeScreen extends StatefulWidget {
  const ComposeScreen({super.key});

  @override
  State<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  final _picker = ImagePicker();
  final _nameCtrl = TextEditingController();

  Uint8List? _photoBytes;
  String? _photoName;
  String? _photoMime;
  List<Category> _categories = [];
  String? _category;

  String _status = '';
  bool _statusError = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    Api.instance.categories().then((raw) {
      if (!mounted) return;
      setState(() => _categories = raw.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList());
    }).catchError((_) => null);
  }

  Future<void> _pick(ImageSource source) async {
    try {
      final file = await _picker.pickImage(source: source, imageQuality: 85);
      if (file == null) return;
      final bytes = await file.readAsBytes();
      setState(() {
        _photoBytes = bytes;
        _photoName = file.name;
        _photoMime = file.mimeType ?? 'image/jpeg';
      });
    } catch (_) {
      setState(() {
        _status = "Impossible d'accéder à la caméra ou à la galerie.";
        _statusError = true;
      });
    }
  }

  Future<void> _submit() async {
    setState(() {
      _status = '';
      _statusError = false;
    });

    if (_photoBytes == null) {
      setState(() {
        _status = "Ajoutez d'abord une photo du produit.";
        _statusError = true;
      });
      return;
    }
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() {
        _status = 'Le nom du produit est requis.';
        _statusError = true;
      });
      return;
    }
    if (_category == null) {
      setState(() {
        _status = 'Choisissez une catégorie pour votre produit.';
        _statusError = true;
      });
      return;
    }

    final auth = context.read<AuthProvider>().auth;
    if (auth == null) return;

    setState(() {
      _submitting = true;
      _status = "Génération d'une description façon Twitter à partir de votre photo…";
    });

    try {
      final image = http.MultipartFile.fromBytes(
        'image',
        _photoBytes!,
        filename: _photoName ?? 'photo.jpg',
        contentType: MediaType.parse(_photoMime ?? 'image/jpeg'),
      );
      final data = await Api.instance.createProduct(auth.token, _nameCtrl.text.trim(), _category!, image);
      setState(() => _status = 'Publié → ${data['description']}');
      await Future.delayed(const Duration(milliseconds: 900));
      if (mounted) Navigator.of(context).pop(true);
    } catch (err) {
      setState(() {
        _status = err is ApiException ? err.message : 'Une erreur s\'est produite.';
        _statusError = true;
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>().auth;

    return Scaffold(
      appBar: AppBar(title: const Text('Publier un produit')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            GestureDetector(
              onTap: () => _pick(ImageSource.gallery),
              child: AspectRatio(
                aspectRatio: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: SnapyColors.panel,
                    borderRadius: BorderRadius.circular(snapyRadius),
                    border: Border.all(color: SnapyColors.hairline, width: 1.5),
                    image: _photoBytes != null ? DecorationImage(image: MemoryImage(_photoBytes!), fit: BoxFit.cover) : null,
                  ),
                  child: _photoBytes == null
                      ? const Center(child: Text('Aucune photo sélectionnée', style: TextStyle(color: SnapyColors.textDim, fontSize: 12)))
                      : null,
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(onPressed: () => _pick(ImageSource.camera), child: const Text('📷 Prendre une photo')),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(onPressed: () => _pick(ImageSource.gallery), child: const Text('🖼️ Galerie')),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nameCtrl,
              maxLength: 80,
              decoration: const InputDecoration(hintText: 'Nom du produit — ex. Veste en jean vintage'),
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories
                  .map(
                    (c) => ChoiceChip(
                      label: Text(c.name),
                      selected: _category == c.name,
                      onSelected: (_) => setState(() => _category = c.name),
                      backgroundColor: SnapyColors.panel,
                      selectedColor: const Color(0x1AE8A33D),
                      side: BorderSide(color: _category == c.name ? SnapyColors.amber : SnapyColors.hairline),
                      labelStyle: TextStyle(color: _category == c.name ? SnapyColors.amber : SnapyColors.textDim, fontSize: 12),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 14),
            if (auth != null)
              Text(
                'Publication en tant que ${auth.storeName.isNotEmpty ? auth.storeName : auth.maskedPhone} — les acheteurs peuvent vous contacter par chat ou WhatsApp.',
                style: const TextStyle(color: SnapyColors.teal, fontSize: 10.5),
              ),
            const SizedBox(height: 14),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: SnapyColors.amberOn))
                  : const Text('Publier le produit'),
            ),
            if (_status.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  _status,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: _statusError ? SnapyColors.error : SnapyColors.textDim, fontSize: 12),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
