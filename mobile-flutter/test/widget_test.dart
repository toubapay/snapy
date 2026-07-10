import 'package:flutter_test/flutter_test.dart';
import 'package:snapy_mobile/theme/colors.dart';

void main() {
  test('Snapy theme builds without error', () {
    final theme = buildSnapyTheme();
    expect(theme.scaffoldBackgroundColor, SnapyColors.ink);
  });
}
