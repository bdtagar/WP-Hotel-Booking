<?php

/**
 * Admin View: Admin statistic canvas room.
 *
 * @version     2.0
 * @package     WP_Hotel_Booking_Statistic/Views
 * @category    View
 * @author      Thimpress, leehld
 */

/**
 * Prevent loading this file directly
 */
defined( 'ABSPATH' ) || exit;

global $hb_report;
?>
<h3 class="chart_title"><?php _e( 'Report Chart Room Unavailable', 'wphb-statistic' ) ?></h3>
<canvas id="hotel_canvas_report_room"></canvas>
<script>
    (function ($) {
        var randomScalingFactor = function () {
            return Math.round(Math.random() * 100);
        };

        window.onload = function () {
            var ctx = document.getElementById('hotel_canvas_report_room').getContext('2d');
            window.myBar = new Chart(ctx).Bar( <?php echo json_encode( $hb_report->series() ) ?>, {
                responsive: true,
                scaleGridLineColor: "rgba(0,0,0,.05)"
            });
        }

        // $.datepicker.setDefaults({ dateFormat: wphb_js.date_time_format });
        $.datepicker.setDefaults({dateFormat: 'mm/dd/yy'});
        $('#tp-hotel-report-checkin').datepicker({
            dateFormat: wphb_js.date_time_format,
            monthNames: wphb_js.monthNames,
            monthNamesShort: wphb_js.monthNamesShort,
            dayNames: wphb_js.dayNames,
            dayNamesShort: wphb_js.dayNamesShort,
            dayNamesMin: wphb_js.dayNamesMin,
            onSelect: function () {
                var _self = $(this),
                    date = $(this).datepicker('getDate'),
                    timestamp = new Date(date) / 1000 - ( new Date().getTimezoneOffset() * 60 );

                $("#tp-hotel-report-checkout").datepicker('option', 'minDate', date);
                _self.parent().find('input[name="report_in_timestamp"]').val(timestamp);
            }
        });

        $('#tp-hotel-report-checkout').datepicker({
            dateFormat: wphb_js.date_time_format,
            monthNames: wphb_js.monthNames,
            monthNamesShort: wphb_js.monthNamesShort,
            dayNames: wphb_js.dayNames,
            dayNamesShort: wphb_js.dayNamesShort,
            dayNamesMin: wphb_js.dayNamesMin,
            onSelect: function () {
                var _self = $(this),
                    date = $(this).datepicker('getDate'),
                    timestamp = new Date(date) / 1000 - ( new Date().getTimezoneOffset() * 60 );
                $("#tp-hotel-report-checkin").datepicker('option', 'maxDate', date)
                _self.parent().find('input[name="report_out_timestamp"]').val(timestamp);
            }
        });
    })(jQuery);

</script>