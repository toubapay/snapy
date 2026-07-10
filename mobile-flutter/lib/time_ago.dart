String timeAgo(int ts) {
  final s = ((DateTime.now().millisecondsSinceEpoch - ts) / 1000).floor();
  if (s < 60) return "à l'instant";
  final m = (s / 60).floor();
  if (m < 60) return 'il y a $m min';
  final h = (m / 60).floor();
  if (h < 24) return 'il y a $h h';
  return 'il y a ${(h / 24).floor()} j';
}

String digitsOnly(String str) => str.replaceAll(RegExp(r'[^\d]'), '');
