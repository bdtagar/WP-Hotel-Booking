<?php

/**
 * WP Hotel Booking admin class.
 *
 * @class       WPHB_Admin_Ajax
 * @version     2.0
 * @package     WP_Hotel_Booking/Classes
 * @category    Class
 * @author      Thimpress, leehld
 */

/**
 * Prevent loading this file directly
 */
defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WPHB_Admin_Ajax' ) ) {
	/**
	 * Class WPHB_Admin_Ajax.
	 */
	class WPHB_Admin_Ajax {

		/**
		 * Init.
		 */
		public static function init() {
			if ( ! is_user_logged_in() ) {
				return;
			}

			$actions = array(
				'extra_panel',
				'admin_booking'
			);

			foreach ( $actions as $action ) {
				add_action( "wp_ajax_wphb_{$action}", array( __CLASS__, $action ) );
			}
		}

		/**
		 * Handle extra panel actions.
		 *
		 * @return bool|int|WP_Error
		 */
		public static function extra_panel() {
			check_ajax_referer( 'wphb_admin_extra_nonce', 'nonce' );

			$args = wp_parse_args( $_REQUEST, array( 'action' => '', 'type' => '' ) );

			// curd
			$curd = new WPHB_Extra_CURD();
			// response
			$result = false;

			switch ( $args['type'] ) {
				case 'new-extra':
					$extra = json_decode( wp_unslash( $args['extra'] ), true );
					// create new extra
					$result = $curd->create( $extra );

					break;
				case 'update-extra':
					$extra  = json_decode( wp_unslash( $args['extra'] ), true );
					$result = $curd->update( $extra );
					break;
				case 'delete-extra':
					$id = $args['extra_id'] ? $args['extra_id'] : '';

					if ( $id && get_post_type( $id ) == WPHB_Extra_CPT ) {
						wp_delete_post( $id, true );
						$result = true;
					}
					break;
				case 'update-list-extra':
					$list_extra = json_decode( wp_unslash( $args['listExtra'] ), true );

					if ( is_array( $list_extra ) && $list_extra ) {
						foreach ( $list_extra as $extra ) {
							$result = $curd->update( $extra );
							if ( ! $result ) {
								return $result;
							}
						}
					}
					break;
				default:
					break;
			}

			if ( is_wp_error( $result ) ) {
				wp_send_json_error( $result->get_error_message() );
			}

			wp_send_json_success( $result );

			return false;
		}

		/**
		 * Handle admin booking actions.
		 *
		 * @return bool|int|WP_Error
		 */
		public static function admin_booking() {
			check_ajax_referer( 'wphb_admin_booking_nonce', 'nonce' );

			$args = wp_parse_args( $_REQUEST, array( 'booking_id' => '', 'action' => '', 'type' => '' ) );

			if ( ! $args['booking_id'] ) {
				return false;
			}

			$booking    = WPHB_Booking::instance( $args['booking_id'] );
			$booking_id = $args['booking_id'];

			// curd
			$curd = new WPHB_Booking_CURD();
			// response
			$result = false;

			switch ( $args['type'] ) {
				case 'check-room-available':
					$item = json_decode( wp_unslash( $args['item'] ), true );

					if ( ! $item ) {
						break;
					}

					// get number room available
					$result = $curd->check_room_available( $booking_id, $item );

					break;

				case 'add-item':
					$item = json_decode( wp_unslash( $args['item'] ), true );

					if ( ! $item ) {
						break;
					}

					// add items to booking
					$result = $curd->add_item( $booking_id, $item );
					break;
				case 'remove-item':
					$booking_item_id = $args['booking_item_id'] ? $args['booking_item_id'] : 0;

					if ( ! $booking_item_id ) {
						break;
					}

					$result = $curd->remove_booking_item( $booking_item_id );

					break;
				default:
					break;
			}

			if ( is_wp_error( $result ) ) {
				wp_send_json_error( $result->get_error_message() );
			}

			wp_send_json_success( $result );

			return false;
		}
	}

}

add_action( 'init', array( 'WPHB_Admin_Ajax', 'init' ) );