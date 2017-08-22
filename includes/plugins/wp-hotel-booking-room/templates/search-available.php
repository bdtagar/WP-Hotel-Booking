<?php

/**
 * The template for search available room from.
 *
 * This template can be overridden by copying it to yourtheme/wp-hotel-booking-room/search-available.php.
 *
 * @version     2.0
 * @package     WP_Hotel_Booking_Room/Templates
 * @category    Templates
 * @author      Thimpress, leehld
 */


/**
 * Prevent loading this file directly
 */
defined( 'ABSPATH' ) || exit;
?>

<?php
global $post;
if ( ! $post || ! is_single( $post->ID ) || get_post_type( $post->ID ) !== 'hb_room' ) {
	return;
}
?>

<div id="single_booking_room_lightbox"></div>
<!--Single search form-->
<script type="text/html" id="tmpl-hb-room-load-form">

    <form action="POST" name="hb-search-single-room"
          class="hb-search-room-results hotel-booking-search hotel-booking-single-room-action">

        <div class="hb-booking-room-form-head">
            <h2><?php printf( '%s', $post->post_title ) ?></h2>
            <p class="description"><?php _e( 'Please set arrival date and departure date before check available.', 'wp-hotel-booking-room' ); ?></p>
        </div>

        <div class="hb-search-results-form-container">
            <div class="hb-booking-room-form-group">
                <div class="hb-booking-room-form-field hb-form-field-input">
                    <input type="text" name="check_in_date" value="{{ data.check_in_date }}"
                           placeholder="<?php _e( 'Arrival Date', 'wp-hotel-booking-room' ); ?>"/>
                </div>
            </div>
            <div class="hb-booking-room-form-group">
                <div class="hb-booking-room-form-field hb-form-field-input">
                    <input type="text" name="check_out_date" value="{{ data.check_out_date }}"
                           placeholder="<?php _e( 'Departure Date', 'wp-hotel-booking-room' ); ?>"/>
                </div>
            </div>
            <div class="hb-booking-room-form-group">
                <input type="hidden" name="room-name" value="<?php printf( '%s', $post->post_title ) ?>"/>
                <input type="hidden" name="room-id" value="<?php printf( '%s', $post->ID ) ?>"/>
                <input type="hidden" name="action" value="wphb_room_check_single_room_available"/>
				<?php wp_nonce_field( 'hb_booking_single_room_check_nonce_action', 'hb-booking-single-room-check-nonce-action' ); ?>
                <button type="submit"
                        class="hb_button"><?php _e( 'Check Available', 'wp-hotel-booking-room' ); ?></button>
            </div>
        </div>
    </form>

</script>

<!--Quanity select-->
<script type="text/html" id="tmpl-hb-room-load-qty">
    <div class="hb-booking-room-form-group">
        <label><?php _e( 'Quantity Available', 'wp-hotel-booking-room' ); ?></label>
        <div class="hb-booking-room-form-field hb-form-field-input">
            <select name="hb-num-of-rooms" id="hotel_booking_room_qty" class="number_room_select">
                <option value=""><?php _e( 'Quantity', 'wp-hotel-booking-room' ); ?></option>
                <# for( var i = 1; i
                <
                = data.qty; i++ ) { #>
                <option value="{{ i }}">{{ i }}</option>
                <# } #>
            </select>
        </div>
    </div>
</script>
