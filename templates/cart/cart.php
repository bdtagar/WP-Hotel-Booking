<?php

/**
 * The template for displaying cart page.
 *
 * This template can be overridden by copying it to yourtheme/wp-hotel-booking/cart/cart.php.
 *
 * @version     2.0
 * @package     WP_Hotel_Booking/Templates
 * @category    Templates
 * @author      Thimpress, leehld
 */


/**
 * Prevent loading this file directly
 */
defined( 'ABSPATH' ) || exit;
?>

<?php
$cart = WPHB_Cart::instance();
global $hb_settings;
?>

<?php if ( $cart->cart_items_count != 0 ) { ?>
    <div id="hotel-booking-cart">

        <form id="hb-cart-form" method="post">
            <h3><?php _e( 'Cart', 'wp-hotel-booking' ); ?></h3>
            <table class="hb_table">
                <thead>
                <th>&nbsp;</th>
                <th class="hb_room_type"><?php _e( 'Room type', 'wp-hotel-booking' ); ?></th>
                <th class="hb_capacity"><?php _e( 'Capacity', 'wp-hotel-booking' ); ?></th>
                <th class="hb_quantity"><?php _e( 'Quantity', 'wp-hotel-booking' ); ?></th>
                <th class="hb_check_in"><?php _e( 'Check in', 'wp-hotel-booking' ); ?></th>
                <th class="hb_check_out"><?php _e( 'Check out', 'wp-hotel-booking' ); ?></th>
                <th class="hb_night"><?php _e( 'Night', 'wp-hotel-booking' ); ?></th>
                <th class="hb_gross_total"><?php _e( 'Gross Total', 'wp-hotel-booking' ); ?></th>
                </thead>
				<?php if ( $rooms = $cart->get_rooms() ) { ?>
					<?php foreach ( $rooms as $cart_id => $room ) { ?>
						<?php
						if ( ( $num_of_rooms = (int) $room->get_data( 'quantity' ) ) == 0 ) {
							continue;
						}
						$cart_extra = $cart->get_extra_packages( $cart_id );
						?>
                        <tr class="hb_checkout_item" data-cart-id="<?php echo esc_attr( $cart_id ); ?>">
                            <td<?php echo $cart_extra ? ' rowspan="' . ( count( $cart_extra ) + 2 ) . '"' : '' ?>>
                                <a href="javascript:void(0)" class="hb_remove_cart_item"
                                   data-cart-id="<?php echo esc_attr( $cart_id ); ?>">
                                    <i class="fa fa-times"></i>
                                </a>
                            </td>
                            <td class="hb_room_type">
                                <a href="<?php echo get_permalink( $room->ID ); ?>"><?php echo esc_html( $room->name ); ?><?php printf( '%s', $room->capacity_title ? ' (' . $room->capacity_title . ')' : '' ); ?></a>
                            </td>
                            <td class="hb_capacity"><?php echo sprintf( _n( '%d adult', '%d adults', $room->capacity, 'wp-hotel-booking' ), $room->capacity ); ?> </td>
                            <td class="hb_quantity">
                                <input type="number" min="1" class="hb_room_number_edit"
                                       name="hotel_booking_cart[<?php echo esc_attr( $cart_id ) ?>]"
                                       value="<?php echo esc_attr( $num_of_rooms ); ?>"/>
                            </td>
                            <td class="hb_check_in"><?php echo date_i18n( hb_get_date_format(), strtotime( $room->get_data( 'check_in_date' ) ) ) ?></td>
                            <td class="hb_check_out"><?php echo date_i18n( hb_get_date_format(), strtotime( $room->get_data( 'check_out_date' ) ) ) ?></td>
                            <td class="hb_night"><?php echo hb_count_nights_two_dates( $room->get_data( 'check_out_date' ), $room->get_data( 'check_in_date' ) ) ?></td>
                            <td class="hb_gross_total">
								<?php echo hb_format_price( $room->total ); ?>
                            </td>
                        </tr>
						<?php if ( $cart_extra ) { ?>
                            <tr class="hb_addition_services_title" data-cart-id="<?php echo esc_attr( $cart_id ); ?>">
                                <td colspan="<?php echo ( 'checkout' === is_hb_checkout() ) ? 6 : 7 ?>">
									<?php _e( 'Addition Services', 'wp-hotel-booking' ); ?>
                                </td>
                            </tr>
						<?php } ?>
                        <!--add extra package items in cart page-->
						<?php do_action( 'hotel_booking_cart_after_item', $room, $cart_id ); ?>
					<?php } ?>

				<?php } ?>

				<?php do_action( 'hotel_booking_before_cart_total' ); ?>

                <tr class="hb_sub_total">
                    <td colspan="8"><?php _e( 'Sub Total', 'wp-hotel-booking' ); ?>
                        <span class="hb-align-right hb_sub_total_value">
                                <?php echo hb_format_price( $cart->sub_total ); ?>
                            </span>
                    </td>
                </tr>
				<?php if ( $tax = hb_get_tax_settings() ) { ?>
                    <tr class="hb_advance_tax">
                        <td colspan="8">
							<?php _e( 'Tax', 'wp-hotel-booking' ); ?>
							<?php if ( $tax < 0 ) { ?>
                                <span><?php printf( __( '(price including tax)', 'wp-hotel-booking' ) ); ?></span>
							<?php } ?>
                            <span class="hb-align-right"><?php echo apply_filters( 'hotel_booking_cart_tax_display', abs( $tax * 100 ) . '%' ); ?></span>
                        </td>
                    </tr>
				<?php } ?>
                <tr class="hb_advance_grand_total">
                    <td colspan="8">
						<?php _e( 'Grand Total', 'wp-hotel-booking' ); ?>
                        <span class="hb-align-right hb_grand_total_value"><?php echo hb_format_price( $cart->total ) ?></span>
                    </td>
                </tr>

				<?php if ( hb_get_advance_payment() ) { ?>
                    <tr class="hb_advance_payment">
                        <td colspan="8">
							<?php printf( __( 'Advance Payment (%s%% of Grand Total)', 'wp-hotel-booking' ), hb_get_advance_payment() ); ?>
                            <span class="hb-align-right hb_advance_payment_value"><?php echo hb_format_price( $cart->advance_payment ); ?></span>
                        </td>
                    </tr>
				<?php } ?>

                <tr>
					<?php wp_nonce_field( 'hb_cart_field', 'hb_cart_field' ); ?>
                </tr>
            </table>
            <p>
                <a href="<?php echo hb_get_checkout_url() ?>"
                   class="hb_button hb_checkout"><?php _e( 'Check Out', 'wp-hotel-booking' ); ?></a>
            </p>
        </form>
    </div>

<?php } else { ?>
    <!--Empty cart-->
    <div class="hb-message message">
        <div class="hb-message-content">
			<?php echo __( 'Your cart is empty!', 'wp-hotel-booking' ) ?>
        </div>
    </div>
    <a href="<?php echo get_site_url( null, 'rooms' ); ?>"
       class="hb_button "><?php echo __( 'Return to list rooms', 'wp-hotel-booking' ); ?></a>
<?php } ?>
