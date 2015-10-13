<?php
	global $hb_cart;

	$rooms = $hb_cart->get_rooms();

?>
<?php if( $rooms ): ?>
	<?php foreach ($rooms as $key => $room): ?>

		<?php hb_get_template( 'loop/mini-cart-loop.php', array( 'room'	=> $room ) ) ?>

	<?php endforeach; ?>
	<div class="hb_mini_cart_footer">

		<a href="<?php echo esc_url( hb_get_checkout_url() ); ?>" class="hb_button hb_checkout"><?php _e( 'Check Out', 'tp-hotel-booking' );?></a>
		<a href="<?php echo esc_url( hb_get_cart_url() ); ?>" class="hb_button hb_view_cart"><?php _e( 'View Cart', 'tp-hotel-booking' );?></a>

	</div>

<?php else: ?>

	<p class="hb_mini_cart_empty"><?php _e( 'Your cart is empty!', 'tp-hotel-booking' ); ?></p>

<?php endif; ?>